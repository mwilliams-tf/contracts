---
name: ux-assessment
description: "Run a structured UX assessment on Aphanitic UI components or routes. Orchestrates Impeccable CLI, axe-core, BackstopJS, and Lighthouse to produce a unified UX Assessment Report conforming to the ux-assessment-report.schema.json. Use when validating UI quality post-implementation or during code review."
argument-hint: "[target-component-or-route]"
user-invocable: true
allowed-tools:
  - Bash(npx impeccable *)
  - Bash(npx backstop *)
  - Bash(npx ng test *)
  - Bash(npx lhci *)
---

# UX Assessment Skill

Runs a multi-tool UX assessment pipeline and produces a structured JSON report conforming to `schemas/ux-assessment-report.schema.json`.

## When to Use

- After implementing a UI feature (post-`speckit.implement`)
- During code review to validate design quality
- As part of CI quality gates
- When running `speckit.validate` on UI surfaces

## Assessment Pipeline

The assessment runs in 5 sequential stages. Each stage is independent and produces partial results that are synthesized into the final report.

### Stage 1: Static Analysis (Impeccable CLI)

Detect design anti-patterns in source files without rendering.

```bash
npx impeccable detect --fast --json <target-paths>
```

**Maps to report sections**: `antiPatterns.findings`, `antiPatterns.score`

**Scoring**:
- 0 findings → score 4
- 1-2 findings → score 3
- 3-4 findings → score 2
- 5-7 findings → score 1
- 8+ findings → score 0

### Stage 2: Accessibility Audit (axe-core)

Run axe-core against rendered components via Karma tests or Playwright.

**Option A — Unit tests** (preferred for library components):
```bash
npx ng test <project> --watch=false --browsers=ChromeHeadless
```
Checks that `toHaveNoViolations()` passes. Results from test output.

**Option B — Playwright** (for routes/pages):
```javascript
const { AxeBuilder } = require('@axe-core/playwright');
const results = await new AxeBuilder({ page }).analyze();
```

**Maps to report sections**: `accessibility.violations`, `accessibility.passes`, `accessibility.score`

**Scoring**:
- 0 critical/serious violations → score 4
- 0 critical, 1-2 serious → score 3
- 0 critical, 3+ serious or 1 critical → score 2
- 2+ critical violations → score 1
- WCAG A failures → score 0

### Stage 3: Cognitive Load Analysis (LLM-guided)

Evaluate the rendered UI against the 8-item cognitive load checklist from [Impeccable's cognitive-load reference](../impeccable/reference/cognitive-load.md).

**Requires**: Screenshot of the rendered component/page.

**Process**:
1. Capture screenshot via Playwright or BackstopJS
2. Evaluate each checklist item:
   - Single focus
   - Chunking (≤4 items per group)
   - Grouping (proximity, borders, shared background)
   - Visual hierarchy (clear primary element)
   - One thing at a time
   - Minimal choices (≤4 visible options per decision point)
   - Working memory (no cross-screen recall needed)
   - Progressive disclosure
3. Count failures → rating

**Maps to report sections**: `cognitiveLoad.checklist`, `cognitiveLoad.rating`

### Stage 4: Nielsen Heuristics Scoring (LLM-guided)

Score all 10 heuristics 0-4 using the criteria from [heuristics-scoring.md](../impeccable/reference/heuristics-scoring.md).

**Requires**: Live interaction with the UI or comprehensive screenshots of all states.

**Process**:
1. Review the component's HTML template for structural heuristics (1-6)
2. Review interaction patterns in the TypeScript for behavioral heuristics (3, 5, 7)
3. Review visual output via screenshot for aesthetic heuristics (8)
4. Check error handling for heuristics 5, 9
5. Score each 0-4 with brief rationale

**Maps to report sections**: `heuristics.scores`, `heuristics.totalScore`

### Stage 5: Performance Budget (Lighthouse CI — optional)

Run Lighthouse against a served route for performance metrics.

```bash
npx lhci collect --url=http://localhost:4200/<route>
npx lhci assert --preset=lighthouse:recommended
```

**Maps to report sections**: `performance.score`, `performance.metrics`, `performance.budgets`

## Synthesis

After all stages complete, synthesize results into the final report:

1. **Calculate overall score** (weighted):
   - Heuristics: (totalScore / 40) × 35 = max 35 points
   - Accessibility: (score / 4) × 30 = max 30 points
   - Anti-patterns: (score / 4) × 20 = max 20 points
   - Cognitive load: rating mapping × 15 = max 15 points
     - low = 15, moderate = 8, high = 0

2. **Derive rating**:
   - 90-100 → excellent
   - 75-89 → good
   - 55-74 → acceptable
   - 35-54 → poor
   - 0-34 → critical

3. **Rank all issues by priority** (P0 > P1 > P2 > P3), take top 5 for `summary.topIssues`

4. **Identify strengths** from high-scoring heuristics (score 4) and clean tool outputs

## Output

Write the assessment report to:
```
.ux-assessments/<target-slug>-<date>.json
```

Also output a human-readable summary to stdout.

## Integration with SpecKit

This skill integrates with the existing SpecKit workflow:

- **Post-implement trigger**: After `speckit.implement` completes on a UI spec, run UX assessment automatically
- **Validation alignment**: Results feed into `speckit.validate` for comprehensive post-implementation checks
- **Issue tracking**: P0/P1 issues from the assessment can be converted to tasks via `speckit.tasks`

## Reference Documents

This skill draws knowledge from:

| Document | Purpose |
|----------|---------|
| [heuristics-scoring.md](../impeccable/reference/heuristics-scoring.md) | Nielsen's 10 heuristics scoring criteria |
| [cognitive-load.md](../impeccable/reference/cognitive-load.md) | Cognitive load checklist and working memory rule |
| [interaction-design.md](../impeccable/reference/interaction-design.md) | 8 interactive states, focus rings, form design |
| [audit.md](../impeccable/reference/audit.md) | 5-dimension technical audit framework |
| [critique.md](../impeccable/reference/critique.md) | Dual-assessment orchestration pattern |
| [ux-assessment-report.schema.json](schemas/ux-assessment-report.schema.json) | Output schema |

## Example Invocation

Preferred (full orchestration via agent):
```
@speckit.ux-audit aphanitic-ui-provision
```

Alternative (skill-level invocation for single components):
```
@ux-assessment projects/aphanitic-ui-provision/src/lib/confirmation-panel
```

Both will:
1. Run `impeccable detect --fast --json` on the target directory
2. Run `ng test aphanitic-ui-provision` to check axe-core tests
3. Capture a screenshot of the component in the studio-simulator
4. Score cognitive load checklist against the screenshot
5. Score Nielsen heuristics against template + behavior + visual

> **Note**: `@speckit.ux-audit` is the recommended entry point — it orchestrates all stages including BackstopJS, Lighthouse, and token validation, and produces the consolidated report. The `@ux-assessment` skill invocation is for component-level analysis.
6. Output the structured report
