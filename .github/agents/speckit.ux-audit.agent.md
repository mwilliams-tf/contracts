---
description: Automated UX quality audit agent that orchestrates all UI assessment tools (Impeccable CLI, axe-core, BackstopJS, Lighthouse CI, token validation) and produces actionable fix plans. Replaces manual multi-step audit commands with a single invocation.
handoffs:
  - label: Fix Anti-Patterns
    agent: speckit.ux-audit
    prompt: Apply the anti-pattern fixes identified in the assessment report
    send: true
  - label: Re-run After Fixes
    agent: speckit.ux-audit
    prompt: Re-run the full UX audit to validate the applied fixes
    send: true
  - label: Implement Fixes
    agent: speckit.implement
    prompt: Implement the UX improvements identified in the audit
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before audit)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_ux_audit` key
- If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
- Filter out hooks where `enabled` is explicitly `false`
- For each executable hook, follow the same hook execution pattern as other SpecKit agents (optional vs mandatory)
- If no hooks are registered, skip silently

## Goal

Execute a **complete, automated UX quality audit** across one or more UI projects. This agent replaces all manual command execution — the developer invokes this agent once and receives a full audit report with prioritized fixes.

## Scope Detection

Determine which projects to audit:

1. **If user specified a project** (e.g., "aphanitic-ui-provision"):
   - Audit only that project

2. **If user said "all" or gave no specific target**:
   - Detect all UI projects by scanning `projects/` for directories with `ng-package.json`
   - Filter to those with `src/` containing `.component.ts` files (actual UI libraries)
   - Exclude `aphanitic-core` (non-UI utility library)
   - Expected projects: `aphanitic-ui-provision`, `aphanitic-ui-connect`, `aphanitic-ui-manage`, `aphanitic-ui-entry`

3. **If user specified "changed" or "diff"**:
   - Use `git diff --name-only HEAD~1` to detect which projects have recent changes
   - Audit only those projects

## Execution Pipeline

For each target project, execute stages sequentially. **All stages are automated — do NOT ask the user to run commands manually.**

### Stage 1: Static Anti-Pattern Detection (Impeccable CLI)

```bash
npx impeccable detect --fast --json "projects/{project}/src"
```

**Parse output**: JSON array of findings with `name`, `file`, `line`, `snippet`, `description`.

**Scoring**: 0 findings → 4/4, 1-2 → 3/4, 3-4 → 2/4, 5-7 → 1/4, 8+ → 0/4

**On failure**: Log error, score as -1 (unknown), continue to next stage.

### Stage 2: Accessibility Audit (axe-core via Karma)

```bash
npx ng test {project} --watch=false --browsers=ChromeHeadless
```

**Parse output**: Strip ANSI codes first (`\u001b\[[0-9;]*m` and `\u001b\[\d+[A-Z]`), then match:
- `Executed N of M SUCCESS` → score 4/4
- `Executed N of M (F FAILED)` → extract violation details from output

**Scoring**: 0 failures → 4/4, a11y-specific failures degrade score per severity.

**On failure**: If Karma crashes (not test failures), log error, score as -1, continue.

### Stage 3: Visual Regression (BackstopJS)

**Pre-check**: Does `backstop.json` exist at workspace root AND does `backstop_data/bitmaps_reference/` contain files?

- **If no baseline exists**: Skip with note "No visual baseline — run `npm run backstop:reference` to establish"
- **If baseline exists AND app is running on port 4200**: Run `npx backstop test --config=backstop.json`
- **If baseline exists but app NOT running**: Attempt to start `npx ng serve studio-simulator` in background, wait for port 4200, then run BackstopJS. Kill the server after.

**Parse output**: Check exit code. 0 = pass, non-zero = visual diffs detected.

**If diffs found**: Report which scenarios failed. Do NOT auto-approve — flag for human review.

### Stage 4: Performance Budgets (Lighthouse CI)

**Pre-check**: Is the app running on port 4200?

- **If app not running**: Start `npx ng serve studio-simulator` in background, wait for port 4200.
- **If app running**: Proceed directly.

Execute:
```bash
npx lhci collect --url="http://localhost:4200/" --numberOfRuns=1 \
  --settings.chromeFlags="--headless --no-sandbox --disable-gpu" \
  --settings.preset=desktop
```

Then:
```bash
npx lhci assert --preset=lighthouse:recommended
```

**Parse output**: Extract category scores (performance, accessibility, best-practices) from `.lighthouseci/lhr-*.json`.

**Scoring**: Performance score directly from Lighthouse (0-100).

**On failure**: If Lighthouse cannot run (Chrome issues, port unavailable), skip with warning.

### Stage 5: Design Token Compliance

**Pre-check**: Does any of these exist? `tokens.json`, `design-tokens.json`, `tokens/index.json`, `style-dictionary.config.js`

- **If no token config**: Skip with note "No design token system configured"
- **If token config exists**: Run `node .agents/skills/ux-assessment/scripts/validate-tokens.mjs "projects/{project}/src"`

**Parse output**: Compliant (0 hardcoded values) or list of violations.

### Stage 6: Consolidated Assessment Runner

After individual stages, also run the consolidated runner for the structured report:

```bash
node .agents/skills/ux-assessment/scripts/run-assessment.mjs {project} --lighthouse
```

This produces the JSON report at `.ux-assessments/{project}-{date}.json`.

## Report Synthesis

After running all stages for all projects, produce a **unified audit summary**:

```markdown
## UX Audit Results

| Project | Anti-Patterns | Accessibility | Performance | Tokens | Overall |
|---------|--------------|---------------|-------------|--------|---------|
| ui-provision | 3/4 (1 finding) | 4/4 | 66/100 | N/A | 83/100 |
| ui-connect | ... | ... | ... | ... | ... |

### Priority Issues (P0/P1)

1. **[P1] layout-transition** — `progress-panel.component.css:21`
   - Issue: `transition: width` triggers layout recalculation on every frame
   - Fix: Use `transform: scaleX()` instead of animating width
   - Impact: Performance degradation during animations

2. ...

### Recommendations

- ...
```

## Fix Execution Mode

If the user's input includes "fix", "repair", "arreglar", or "resolver":

1. After generating the report, **automatically apply fixes** for P0 and P1 issues
2. For each fix:
   - Read the affected file
   - Apply the correction (anti-pattern fixes are typically CSS changes)
   - Verify the fix compiles: `npx ng build {project}`
3. After all fixes, **re-run the affected stages** to confirm improvement
4. Report before/after scores

If the user did NOT request fixes, present the findings and ask:
```
Found {N} issues across {M} projects. Would you like me to apply the fixes?
```

## Post-Audit Actions

1. **Write report** to `.ux-assessments/{project}-{date}.json` (done by runner)
2. **Update BackstopJS baseline** if visual changes were intentional: `npx backstop approve`
3. **Commit reports**: Offer to commit assessment results

## Error Recovery

- **Chrome not found**: Suggest `CHROME_BIN=$(which chromium)` or skip browser-dependent stages
- **Port 4200 occupied**: Check what's running with `lsof -ti:4200`, offer to use it or kill it
- **ng test timeout**: Kill after 120s, report as "timed out" with partial results
- **Lighthouse timeout**: Kill after 90s, skip performance stage

## Integration Points

This agent is designed to be invoked:
- **After `speckit.implement`**: Via the `after_implement` hook or handoff
- **Before `speckit.validate`**: To feed UX findings into validation context
- **Standalone**: `@speckit.ux-audit all` or `@speckit.ux-audit aphanitic-ui-provision`
- **In CI**: The runner script (`npm run assess:ux`) works without this agent for non-interactive contexts
