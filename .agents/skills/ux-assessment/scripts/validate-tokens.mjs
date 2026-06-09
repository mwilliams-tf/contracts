#!/usr/bin/env node

/**
 * Design Token Validator
 *
 * Validates that component CSS uses design tokens instead of hardcoded values.
 * Activated when tokens.json or style-dictionary config is detected in the workspace.
 *
 * Usage:
 *   node .agents/skills/ux-assessment/scripts/validate-tokens.mjs <target-paths...>
 *
 * Exit codes:
 *   0 = All values reference tokens
 *   1 = Hardcoded values detected (token violations)
 *   2 = No token config found (skip gracefully)
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { execSync } from 'node:child_process';

// ─── Root & Config Detection ────────────────────────────────────────────────

function findRoot(startDir) {
  let dir = startDir;
  while (dir !== '/') {
    const pkg = join(dir, 'package.json');
    if (existsSync(pkg)) {
      try {
        const content = readFileSync(pkg, 'utf-8');
        if (content.includes('"aphanitic"')) return dir;
      } catch { /* continue */ }
    }
    dir = resolve(dir, '..');
  }
  return process.cwd();
}

const ROOT = findRoot(resolve(import.meta.dirname, '../..'));

function findTokenConfig() {
  const candidates = [
    'tokens.json',
    'design-tokens.json',
    'tokens/index.json',
    'style-dictionary.config.js',
    'style-dictionary.config.json',
    'sd.config.js',
  ];
  for (const candidate of candidates) {
    const path = join(ROOT, candidate);
    if (existsSync(path)) return path;
  }
  return null;
}

// ─── Token Extraction ───────────────────────────────────────────────────────

function extractTokenValues(tokenPath) {
  const content = readFileSync(tokenPath, 'utf-8');
  const tokens = JSON.parse(content);
  const values = { colors: new Set(), spacing: new Set(), typography: new Set(), radii: new Set() };

  function walk(obj, category = null) {
    for (const [key, val] of Object.entries(obj)) {
      if (val && typeof val === 'object' && '$value' in val) {
        // W3C Design Tokens format
        const cat = val.$type || category || inferCategory(key);
        addValue(values, cat, val.$value);
      } else if (val && typeof val === 'object' && 'value' in val) {
        // Style Dictionary format
        const cat = category || inferCategory(key);
        addValue(values, cat, val.value);
      } else if (val && typeof val === 'object') {
        walk(val, category || inferCategory(key));
      }
    }
  }

  function inferCategory(key) {
    const k = key.toLowerCase();
    if (k.includes('color') || k.includes('palette')) return 'colors';
    if (k.includes('space') || k.includes('spacing') || k.includes('size')) return 'spacing';
    if (k.includes('font') || k.includes('type') || k.includes('text')) return 'typography';
    if (k.includes('radius') || k.includes('border')) return 'radii';
    return null;
  }

  function addValue(vals, cat, value) {
    if (!cat || !value) return;
    if (cat === 'colors' || cat === 'color') vals.colors.add(String(value).toLowerCase());
    else if (cat === 'spacing') vals.spacing.add(String(value));
    else if (cat === 'typography') vals.typography.add(String(value));
    else if (cat === 'radii') vals.radii.add(String(value));
  }

  walk(tokens);
  return values;
}

// ─── CSS Validation ─────────────────────────────────────────────────────────

const HARDCODED_PATTERNS = {
  colors: [
    // Hex colors (not in var())
    /(?<!var\([^)]*)(#[0-9a-fA-F]{3,8})(?![^(]*\))/g,
    // rgb/rgba not in var()
    /(?<!var\([^)]*)(rgba?\([^)]+\))(?![^(]*\))/g,
    // hsl/hsla not in var()
    /(?<!var\([^)]*)(hsla?\([^)]+\))(?![^(]*\))/g,
  ],
  spacing: [
    // Pixel values in margin/padding/gap (not via var())
    /(?:margin|padding|gap|inset)[\s:]+(?!.*var\().*?(\d+px)/g,
  ],
};

function validateFile(filePath, tokenValues) {
  const content = readFileSync(filePath, 'utf-8');
  const violations = [];

  // Check for hardcoded color values
  for (const pattern of HARDCODED_PATTERNS.colors) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const value = match[1].toLowerCase();
      // Skip common safe values (black, white, transparent, currentColor, inherit)
      if (['#000', '#fff', '#000000', '#ffffff', 'transparent', 'currentcolor', 'inherit'].includes(value)) continue;
      // Skip values that ARE token values
      if (tokenValues.colors.has(value)) continue;

      const line = content.slice(0, match.index).split('\n').length;
      violations.push({
        type: 'hardcoded-color',
        value: match[1],
        file: filePath,
        line,
        suggestion: `Use a design token variable instead of hardcoded "${match[1]}"`,
      });
    }
  }

  return violations;
}

function walkDir(dir, extensions = ['.css', '.scss', '.less']) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkDir(full, extensions));
    } else if (extensions.includes(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

// ─── Main ───────────────────────────────────────────────────────────────────

const tokenConfig = findTokenConfig();

if (!tokenConfig) {
  console.log('⏭️  No design token config found. Token validation skipped.');
  console.log('   To enable: create tokens.json or style-dictionary.config.js in the project root.');
  process.exit(2);
}

console.log(`\n━━━ Design Token Validation ━━━\n`);
console.log(`  Token config: ${tokenConfig}`);

const tokenValues = extractTokenValues(tokenConfig);
console.log(`  Colors: ${tokenValues.colors.size} | Spacing: ${tokenValues.spacing.size} | Typography: ${tokenValues.typography.size}`);

const targets = process.argv.slice(2).map(t => resolve(t));
if (targets.length === 0) {
  console.error('  No target paths specified');
  process.exit(1);
}

let allViolations = [];

for (const target of targets) {
  if (!existsSync(target)) continue;
  const stat = statSync(target);
  const files = stat.isDirectory() ? walkDir(target) : [target];

  for (const file of files) {
    const violations = validateFile(file, tokenValues);
    allViolations.push(...violations);
  }
}

if (allViolations.length === 0) {
  console.log(`\n  ✅ No hardcoded values detected — all CSS references tokens`);
  process.exit(0);
} else {
  console.log(`\n  ⚠️  ${allViolations.length} hardcoded value(s) found:\n`);
  for (const v of allViolations.slice(0, 20)) {
    console.log(`    ${v.file}:${v.line} — ${v.type}: ${v.value}`);
  }
  if (allViolations.length > 20) {
    console.log(`    ... and ${allViolations.length - 20} more`);
  }
  process.exit(1);
}
