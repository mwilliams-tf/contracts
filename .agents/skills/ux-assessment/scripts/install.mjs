#!/usr/bin/env node

/**
 * UX Assessment Skill Installer
 *
 * Installs the ux-assessment skill into any Angular workspace.
 * Copies skill files to .agents/skills/ux-assessment/ and adds npm scripts.
 *
 * Usage:
 *   npx @aphanitic/ux-assessment-skill install
 *   node .agents/skills/ux-assessment/scripts/install.mjs [--target <dir>]
 */

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SKILL_ROOT = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);

const targetIdx = args.indexOf('--target');
const targetDir = targetIdx !== -1 ? resolve(args[targetIdx + 1]) : process.cwd();

const destSkillDir = join(targetDir, '.agents', 'skills', 'ux-assessment');

console.log(`\n📦 Installing UX Assessment Skill`);
console.log(`   Source: ${SKILL_ROOT}`);
console.log(`   Target: ${destSkillDir}\n`);

// 1. Copy skill files
mkdirSync(destSkillDir, { recursive: true });
for (const item of ['SKILL.md', 'README.md', 'package.json', 'schemas', 'scripts', 'templates']) {
  const src = join(SKILL_ROOT, item);
  if (existsSync(src)) {
    cpSync(src, join(destSkillDir, item), { recursive: true });
    console.log(`  ✓ ${item}`);
  }
}

// 2. Add npm scripts to target package.json
const pkgPath = join(targetDir, 'package.json');
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const scripts = pkg.scripts || {};
  let modified = false;

  if (!scripts['assess:ux']) {
    scripts['assess:ux'] = 'node .agents/skills/ux-assessment/scripts/run-assessment.mjs';
    modified = true;
  }
  if (!scripts['lhci:collect']) {
    scripts['lhci:collect'] = 'lhci collect';
    modified = true;
  }
  if (!scripts['lhci:assert']) {
    scripts['lhci:assert'] = 'lhci assert';
    modified = true;
  }

  if (modified) {
    pkg.scripts = scripts;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ✓ Added npm scripts to package.json`);
  } else {
    console.log(`  – npm scripts already present`);
  }
}

// 3. Add .ux-assessments and .lighthouseci to .gitignore
const gitignorePath = join(targetDir, '.gitignore');
if (existsSync(gitignorePath)) {
  let gitignore = readFileSync(gitignorePath, 'utf-8');
  let modified = false;

  if (!gitignore.includes('.ux-assessments')) {
    gitignore += '\n# UX Assessments (generated reports)\n/.ux-assessments\n';
    modified = true;
  }
  if (!gitignore.includes('.lighthouseci')) {
    gitignore += '\n# Lighthouse CI\n/.lighthouseci\n';
    modified = true;
  }
  if (!gitignore.includes('backstop_data/bitmaps_test')) {
    gitignore += '\n# BackstopJS (test bitmaps are generated, references are committed)\n/backstop_data/bitmaps_test\n/backstop_data/html_report\n';
    modified = true;
  }

  if (modified) {
    writeFileSync(gitignorePath, gitignore);
    console.log(`  ✓ Updated .gitignore`);
  }
}

// 4. Create lighthouserc.js if not present
const lhrcPath = join(targetDir, 'lighthouserc.js');
if (!existsSync(lhrcPath)) {
  const template = join(SKILL_ROOT, 'templates', 'lighthouserc.js');
  if (existsSync(template)) {
    cpSync(template, lhrcPath);
    console.log(`  ✓ Created lighthouserc.js (configure startServerCommand for your project)`);
  }
}

// 5. Create backstop.json if not present
const backstopPath = join(targetDir, 'backstop.json');
if (!existsSync(backstopPath)) {
  const template = join(SKILL_ROOT, 'templates', 'backstop.json');
  if (existsSync(template)) {
    cpSync(template, backstopPath);
    console.log(`  ✓ Created backstop.json (configure scenarios[].url for your project)`);
  }
}

console.log(`\n✅ UX Assessment Skill installed successfully`);
console.log(`\n   Run: npm run assess:ux <project-name>`);
console.log(`   Run with Lighthouse: npm run assess:ux <project-name> --lighthouse\n`);
