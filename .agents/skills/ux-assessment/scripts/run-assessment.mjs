#!/usr/bin/env node

/**
 * UX Assessment Runner
 *
 * Orchestrates Impeccable CLI + axe-core test results + Lighthouse CI
 * to produce a structured UX Assessment Report.
 *
 * Usage:
 *   node scripts/run-assessment.mjs <target-project> [--route <path>] [--lighthouse]
 *
 * Examples:
 *   node scripts/run-assessment.mjs aphanitic-ui-provision
 *   node scripts/run-assessment.mjs aphanitic-ui-provision --route /provision --lighthouse
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Resolve workspace root: walk up from script dir until we find package.json with "aphanitic"
function findRoot(startDir) {
  let dir = startDir;
  while (dir !== '/') {
    const pkg = join(dir, 'package.json');
    if (existsSync(pkg)) {
      try {
        const content = execSync(`cat "${pkg}"`, { encoding: 'utf-8' });
        if (content.includes('"aphanitic"')) return dir;
      } catch { /* continue */ }
    }
    dir = resolve(dir, '..');
  }
  return process.cwd();
}

const ROOT = findRoot(resolve(import.meta.dirname, '../..'));
const REPORTS_DIR = join(ROOT, '.ux-assessments');

// ─── CLI Argument Parsing ───────────────────────────────────────────────────

const args = process.argv.slice(2);
const targetProject = args.find(a => !a.startsWith('--'));
const route = args.includes('--route') ? args[args.indexOf('--route') + 1] : null;
const runLighthouse = args.includes('--lighthouse');

if (!targetProject) {
  console.error('Usage: run-assessment.mjs <target-project> [--route <path>] [--lighthouse]');
  process.exit(1);
}

const projectSrcPath = join(ROOT, 'projects', targetProject, 'src');

if (!existsSync(projectSrcPath)) {
  console.error(`Project source not found: ${projectSrcPath}`);
  process.exit(1);
}

// ─── Stage 1: Impeccable Anti-Pattern Detection ─────────────────────────────

function runImpeccable() {
  console.log('\n━━━ Stage 1: Impeccable Anti-Pattern Detection ━━━\n');
  try {
    const output = execSync(
      `npx impeccable detect --fast --json "${projectSrcPath}"`,
      { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const findings = JSON.parse(output);
    const score = findings.length === 0 ? 4
      : findings.length <= 2 ? 3
      : findings.length <= 4 ? 2
      : findings.length <= 7 ? 1 : 0;

    console.log(`  Found ${findings.length} anti-pattern(s) → score ${score}/4`);
    return { findings, score };
  } catch (err) {
    // Exit code 2 = findings detected (normal)
    if (err.status === 2 && err.stdout) {
      const findings = JSON.parse(err.stdout);
      const score = findings.length === 0 ? 4
        : findings.length <= 2 ? 3
        : findings.length <= 4 ? 2
        : findings.length <= 7 ? 1 : 0;

      console.log(`  Found ${findings.length} anti-pattern(s) → score ${score}/4`);
      return { findings, score };
    }
    console.error('  Impeccable failed:', err.message);
    return { findings: [], score: -1 };
  }
}

// ─── Stage 2: Accessibility (ng test with axe-core) ─────────────────────────

function runAccessibility() {
  console.log('\n━━━ Stage 2: Accessibility Audit (axe-core via Karma) ━━━\n');
  let output;
  try {
    output = execSync(
      `npx ng test ${targetProject} --watch=false --browsers=ChromeHeadless 2>&1`,
      { cwd: ROOT, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (err) {
    // ng test may exit non-zero when tests fail — output is still in stdout
    output = err.stdout || err.output?.join('') || '';
  }

  // Strip ANSI escape codes
  output = output.replace(/\u001b\[[0-9;]*m/g, '').replace(/\u001b\[\d+[A-Z]/g, '');

  const successMatch = output.match(/Executed (\d+) of (\d+)\s*SUCCESS/);
  const failMatch = output.match(/Executed \d+ of (\d+)\s*\((\d+) FAILED\)/);

  if (successMatch) {
    const total = parseInt(successMatch[2]);
    console.log(`  All ${total} tests passed (including a11y) → score 4/4`);
    return { violations: [], passes: total, score: 4 };
  } else if (failMatch) {
    const total = parseInt(failMatch[1]);
    const failed = parseInt(failMatch[2]);
    const violations = [];
    const violationBlocks = [...output.matchAll(/Elements must ([^\n]+)/g)];
    for (const m of violationBlocks) {
      violations.push({ description: `Elements must ${m[1]}` });
    }
    const score = violations.length === 0 ? 3 : violations.length <= 2 ? 2 : 1;
    console.log(`  ${failed} test(s) failed, ${violations.length} a11y violation(s) → score ${score}/4`);
    return { violations, passes: total - failed, score };
  }

  console.log('  Could not parse test output');
  return { violations: [], passes: 0, score: -1 };
}

// ─── Stage 3: Lighthouse (optional) ─────────────────────────────────────────

function runLighthouseCI() {
  console.log('\n━━━ Stage 3: Lighthouse CI ━━━\n');

  if (!runLighthouse) {
    console.log('  Skipped (use --lighthouse to enable)');
    return null;
  }

  const url = route
    ? `http://localhost:4200${route}`
    : 'http://localhost:4200/';

  // Clean previous results
  const lhciDir = join(ROOT, '.lighthouseci');
  execSync(`rm -rf "${lhciDir}"`, { cwd: ROOT });

  try {
    // Collect — run Lighthouse against the given URL
    // Assumes the app is already running on port 4200
    execSync(
      `npx lhci collect --url="${url}" --numberOfRuns=1 ` +
      `--settings.chromeFlags="--headless --no-sandbox --disable-gpu" ` +
      `--settings.preset=desktop 2>&1`,
      { cwd: ROOT, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 90000 }
    );
    console.log(`  Collected Lighthouse data for ${url}`);

    // Parse the latest result JSON from .lighthouseci/
    if (existsSync(lhciDir)) {
      const files = execSync(`find "${lhciDir}" -name "lhr-*.json" -type f`, { encoding: 'utf-8' })
        .trim().split('\n').filter(Boolean);

      if (files.length > 0) {
        const latestFile = files[files.length - 1];
        const result = JSON.parse(execSync(`cat "${latestFile}"`, { encoding: 'utf-8' }));

        const perf = result.categories?.performance?.score ?? 0;
        const a11y = result.categories?.accessibility?.score ?? 0;
        const bp = result.categories?.['best-practices']?.score ?? 0;

        console.log(`  Performance: ${Math.round(perf * 100)}/100`);
        console.log(`  Accessibility: ${Math.round(a11y * 100)}/100`);
        console.log(`  Best Practices: ${Math.round(bp * 100)}/100`);

        return {
          score: Math.round(perf * 100),
          categories: {
            performance: Math.round(perf * 100),
            accessibility: Math.round(a11y * 100),
            bestPractices: Math.round(bp * 100),
          },
          metrics: {
            firstContentfulPaint: result.audits?.['first-contentful-paint']?.numericValue,
            largestContentfulPaint: result.audits?.['largest-contentful-paint']?.numericValue,
            totalBlockingTime: result.audits?.['total-blocking-time']?.numericValue,
            cumulativeLayoutShift: result.audits?.['cumulative-layout-shift']?.numericValue,
            speedIndex: result.audits?.['speed-index']?.numericValue,
          }
        };
      }
    }

    console.log('  No Lighthouse results found');
    return null;
  } catch (err) {
    console.error('  Lighthouse failed:', err.message?.slice(0, 200));
    return null;
  }
}

// ─── Stage 4: Design Token Compliance (optional) ────────────────────────────

function runTokenValidation() {
  console.log('\n━━━ Stage 4: Design Token Compliance ━━━\n');

  // Check for token config
  const tokenConfigs = [
    'tokens.json', 'design-tokens.json', 'tokens/index.json',
    'style-dictionary.config.js', 'style-dictionary.config.json',
  ];
  const hasTokens = tokenConfigs.some(c => existsSync(join(ROOT, c)));

  if (!hasTokens) {
    console.log('  Skipped (no token config detected)');
    return null;
  }

  try {
    const scriptPath = join(import.meta.dirname, 'validate-tokens.mjs');
    const output = execSync(
      `node "${scriptPath}" "${projectSrcPath}" 2>&1`,
      { cwd: ROOT, encoding: 'utf-8' }
    );
    // Exit 0 = no violations
    console.log('  All CSS values reference design tokens → compliant');
    return { compliant: true, violations: [] };
  } catch (err) {
    if (err.status === 2) {
      // No token config found (redundant guard)
      console.log('  Skipped (no token config)');
      return null;
    }
    // Exit 1 = violations found
    const output = err.stdout || '';
    const violationMatch = output.match(/(\d+) hardcoded value/);
    const count = violationMatch ? parseInt(violationMatch[1]) : 0;
    console.log(`  ${count} hardcoded value(s) detected — not using tokens`);
    return { compliant: false, violations: count };
  }
}

// ─── Report Assembly ────────────────────────────────────────────────────────

function assembleReport(impeccable, accessibility, lighthouse, tokens) {
  const now = new Date().toISOString();
  const slug = targetProject.replace(/[^a-z0-9-]/gi, '-');
  const dateStr = now.slice(0, 10);

  // Calculate overall score (weighted)
  const heuristicsPlaceholder = 30; // Placeholder — LLM fills this in real assessments
  const heuristicsWeight = (heuristicsPlaceholder / 40) * 35;
  const a11yWeight = (Math.max(0, accessibility.score) / 4) * 30;
  const antiPatternWeight = (Math.max(0, impeccable.score) / 4) * 20;
  const cogLoadWeight = 12; // Placeholder — LLM fills this

  const overallScore = Math.round(heuristicsWeight + a11yWeight + antiPatternWeight + cogLoadWeight);
  const rating = overallScore >= 90 ? 'excellent'
    : overallScore >= 75 ? 'good'
    : overallScore >= 55 ? 'acceptable'
    : overallScore >= 35 ? 'poor' : 'critical';

  const report = {
    metadata: {
      timestamp: now,
      target: {
        type: 'library',
        identifier: projectSrcPath,
        project: targetProject,
      },
      tools: {
        impeccable: '1.x',
        axeCore: '4.x',
        ...(lighthouse ? { lighthouse: '12.x' } : {}),
      },
    },
    summary: {
      overallScore,
      rating,
      topIssues: impeccable.findings.slice(0, 5).map(f => ({
        priority: 'P2',
        category: 'anti-pattern',
        description: `${f.name}: ${f.snippet}`,
        location: { file: f.file, line: f.line },
        suggestion: f.description,
        impact: 'moderate',
      })),
      strengths: [],
    },
    antiPatterns: {
      score: impeccable.score,
      findings: impeccable.findings,
    },
    accessibility: {
      score: accessibility.score,
      violations: accessibility.violations,
      passes: accessibility.passes,
    },
    cognitiveLoad: {
      rating: 'moderate',
      checklist: {
        singleFocus: true,
        chunking: true,
        grouping: true,
        visualHierarchy: true,
        oneThingAtATime: true,
        minimalChoices: true,
        workingMemory: true,
        progressiveDisclosure: true,
      },
      maxDecisionPoints: 2,
    },
    heuristics: {
      totalScore: heuristicsPlaceholder,
      scores: {
        visibilityOfSystemStatus: { score: 3, rationale: 'Automated placeholder — requires LLM review' },
        matchBetweenSystemAndRealWorld: { score: 3, rationale: 'Automated placeholder' },
        userControlAndFreedom: { score: 3, rationale: 'Automated placeholder' },
        consistencyAndStandards: { score: 3, rationale: 'Automated placeholder' },
        errorPrevention: { score: 3, rationale: 'Automated placeholder' },
        recognitionRatherThanRecall: { score: 3, rationale: 'Automated placeholder' },
        flexibilityAndEfficiency: { score: 3, rationale: 'Automated placeholder' },
        aestheticAndMinimalistDesign: { score: 3, rationale: 'Automated placeholder' },
        helpUsersWithErrors: { score: 3, rationale: 'Automated placeholder' },
        helpAndDocumentation: { score: 3, rationale: 'Automated placeholder' },
      },
    },
    ...(lighthouse ? { performance: lighthouse } : {}),
    ...(tokens ? { designTokens: tokens } : {}),
  };

  // Write report
  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = join(REPORTS_DIR, `${slug}-${dateStr}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n━━━ Report Written ━━━\n`);
  console.log(`  Path: ${reportPath}`);
  console.log(`  Overall: ${overallScore}/100 (${rating})`);
  console.log(`  Anti-patterns: ${impeccable.score}/4`);
  console.log(`  Accessibility: ${accessibility.score}/4`);
  if (lighthouse) console.log(`  Performance: ${lighthouse.score}/100`);

  return report;
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log(`\n╔══════════════════════════════════════════╗`);
console.log(`║   UX Assessment: ${targetProject.padEnd(21)}║`);
console.log(`╚══════════════════════════════════════════╝`);

const impeccableResult = runImpeccable();
const accessibilityResult = runAccessibility();
const lighthouseResult = runLighthouseCI();
const tokenResult = runTokenValidation();

const report = assembleReport(impeccableResult, accessibilityResult, lighthouseResult, tokenResult);

// Exit with appropriate code
const hasIssues = impeccableResult.findings.length > 0 || accessibilityResult.violations.length > 0;
process.exit(hasIssues ? 1 : 0);
