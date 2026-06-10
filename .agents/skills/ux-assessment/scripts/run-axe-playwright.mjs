#!/usr/bin/env node
/**
 * Run axe-core accessibility audit against live routes via Playwright.
 * Usage: node run-axe-playwright.mjs [--base-url http://localhost:5173]
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = process.argv.includes('--base-url')
  ? process.argv[process.argv.indexOf('--base-url') + 1]
  : 'http://localhost:5173';

const routes = ['/', '/chat', '/solicitud'];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const allViolations = [];
let passes = 0;

for (const route of routes) {
  const url = `${baseUrl}${route}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  const results = await new AxeBuilder({ page }).analyze();
  passes += results.passes.length;
  for (const v of results.violations) {
    allViolations.push({
      id: v.id,
      impact: v.impact,
      description: v.description,
      route,
      nodes: v.nodes.length,
      help: v.help,
    });
  }
}

await browser.close();

const deduped = [];
const seen = new Set();
for (const v of allViolations) {
  const key = `${v.id}:${v.route}`;
  if (!seen.has(key)) {
    seen.add(key);
    deduped.push(v);
  }
}

const critical = deduped.filter((v) => v.impact === 'critical').length;
const serious = deduped.filter((v) => v.impact === 'serious').length;

let score = 4;
if (critical >= 2) score = 1;
else if (critical >= 1) score = 2;
else if (serious >= 3) score = 2;
else if (serious >= 1) score = 3;

console.log(JSON.stringify({ violations: deduped, passes, score, routes }, null, 2));
process.exit(deduped.length > 0 ? 1 : 0);
