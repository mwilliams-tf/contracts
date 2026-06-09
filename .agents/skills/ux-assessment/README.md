# UX Assessment Skill

A portable, AI-agent-compatible UX assessment framework that orchestrates multiple tools to produce structured quality reports for Angular UI libraries.

## What It Does

Runs a 5-stage pipeline and produces a JSON report conforming to a defined schema:

| Stage | Tool | What It Measures |
|-------|------|-----------------|
| 1. Anti-patterns | Impeccable CLI | 29 design anti-patterns (no rendering needed) |
| 2. Accessibility | axe-core via Karma | WCAG violations in rendered components |
| 3. Cognitive Load | LLM-guided | 8-item checklist (chunking, hierarchy, etc.) |
| 4. Heuristics | LLM-guided | Nielsen's 10 heuristics scored 0-4 |
| 5. Performance | Lighthouse CI | Core Web Vitals and budgets |

## Quick Start

### In an existing Angular workspace

```bash
# Install peer dependencies
npm install --save-dev impeccable axe-core jasmine-axe @lhci/cli

# Copy skill files (or use the install script)
node .agents/skills/ux-assessment/scripts/install.mjs

# Run assessment
npm run assess:ux <project-name>

# With Lighthouse (requires app to be running on :4200)
npm run assess:ux <project-name> --lighthouse
```

### Adopting in a new repository

1. Copy the `.agents/skills/ux-assessment/` directory to your repo
2. Run `node .agents/skills/ux-assessment/scripts/install.mjs`
3. Install the peer dependencies: `npm i -D impeccable axe-core jasmine-axe`
4. (Optional) Install `@lhci/cli` for performance budgets

## Output

Reports are written to `.ux-assessments/<project>-<date>.json`:

```json
{
  "metadata": { "timestamp": "...", "target": {...}, "tools": {...} },
  "summary": { "overallScore": 83, "rating": "good", "topIssues": [...] },
  "antiPatterns": { "score": 3, "findings": [...] },
  "accessibility": { "score": 4, "violations": [], "passes": 35 },
  "cognitiveLoad": { "rating": "moderate", "checklist": {...} },
  "heuristics": { "totalScore": 30, "scores": {...} },
  "performance": { "score": 66, "metrics": {...} }
}
```

## Scoring

Overall score (0-100) uses weighted components:

- **Heuristics** (35%): (totalScore / 40) × 35
- **Accessibility** (30%): (score / 4) × 30
- **Anti-patterns** (20%): (score / 4) × 20
- **Cognitive load** (15%): rating-based (low=15, moderate=8, high=0)

Ratings: excellent (90+) | good (75-89) | acceptable (55-74) | poor (35-54) | critical (0-34)

## SpecKit Integration

The skill integrates with SpecKit via the `speckit.ux-audit` agent and the `after_implement` hook:

- **`speckit.implement` → hook → `speckit.ux-audit`**: After implementation, the agent is offered automatically
- **`speckit.ux-audit` → handoff → `speckit.validate`**: Assessment results feed into UI validation
- **Handoffs from `speckit.implement`**: "Run UX Audit" button available after completing tasks
- P0/P1 issues can be fixed directly by the audit agent or converted to tasks via `speckit.tasks`

## AI Agent Usage

### Recommended: Full Audit Agent

The `speckit.ux-audit` agent orchestrates the complete pipeline in a single invocation:

```
@speckit.ux-audit aphanitic-ui-provision
@speckit.ux-audit all
@speckit.ux-audit all fix
```

This runs all stages (Impeccable, axe-core, BackstopJS, Lighthouse, tokens), produces the consolidated report, and offers to apply fixes.

### Alternative: Skill-level invocation

The `SKILL.md` is consumed by AI agents for component-level assessment:

```
@ux-assessment aphanitic-ui-provision
```

The agent will:
1. Run automated stages (Impeccable, axe-core, Lighthouse)
2. Evaluate cognitive load and heuristics via LLM analysis
3. Synthesize results into the structured report
4. Surface top issues with actionable suggestions

### SpecKit Integration

The audit runs automatically as part of the development workflow:
```
speckit.implement → [after_implement hook] → speckit.ux-audit → speckit.validate
```

No manual command execution required.

## Schema

The full report schema is at `schemas/ux-assessment-report.schema.json` (JSON Schema draft-07).

## Portability

This skill is self-contained and can be transplanted to any Angular workspace:

- No build step required (ESM scripts run directly with Node.js 20+)
- Peer dependencies are common tooling already in most Angular projects
- The schema and SKILL.md are framework-agnostic knowledge
- Lighthouse config template adapts to any dev server
