---
description: Post-implementation UI validation agent that verifies implemented features match documentation (quickstart.md) by interacting with the running application via Playwright browser tools.
handoffs:
  - label: Run UX Audit
    agent: speckit.ux-audit
    prompt: Run a full UX quality audit before visual validation
    send: true
  - label: Fix Documentation Drift
    agent: speckit.validate
    prompt: Apply documentation fixes for the discrepancies found
    send: true
  - label: Re-run Implementation
    agent: speckit.implement
    prompt: Fix the UI issues found during validation
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before validation)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_validate` key
- If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the Goal.
    ```
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Goal

Validate that the implemented UI matches the documentation (quickstart.md) by:
1. Running the application locally
2. Navigating to each documented route/flow using Playwright browser tools
3. Verifying UI elements, labels, interactions, and behavior match what quickstart.md describes
4. Reporting discrepancies between documentation and actual UI
5. Optionally fixing the documentation to match the implementation (or vice versa)

This agent bridges the gap between `speckit.implement` (which writes code) and the documentation artifacts (which describe expected behavior). It ensures the pipeline produces a consistent, verified end state.

## Operating Constraints

- **Browser-based validation**: Use Playwright browser tools (open_browser_page, click_element, read_page, screenshot_page) to interact with the running application
- **Non-destructive by default**: Report discrepancies first; only apply fixes with user approval
- **Documentation is secondary to implementation**: If the UI works correctly but documentation is wrong, fix the documentation. If the UI is broken, recommend re-running `speckit.implement` with fixes.
- **Functional verification**: Beyond visual checks, verify that interactive elements (buttons, forms, dropdowns) respond correctly
- **Screenshot evidence**: Take screenshots at each validation step for audit trail
- **No silent skipping**: Every numbered quickstart step MUST be accounted for with an explicit status (`PASS`, `FAIL`, `PARTIAL`, `MANUAL_REQUIRED`, `BLOCKED`)
- **Azure-dependent fallback required**: If a step cannot be fully automated due to missing Azure prerequisites, produce a manual validation playbook with exact prerequisites, actions, expected outcomes, and evidence to capture
- **Validate what is still testable**: For Azure-dependent flows, still validate all UI affordances and local interactions (fields, labels, toggles, validation, progress UI) before marking any part manual

## Execution Steps

### 1. Initialize Validation Context

Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS.

Load:
- **REQUIRED**: `quickstart.md` — the validation source of truth for expected UI behavior
- **REQUIRED**: `plan.md` — for tech stack, dev server command, and port
- **OPTIONAL**: `spec.md` — for functional requirements and acceptance criteria
- **OPTIONAL**: `tasks.md` — for implementation status of each feature
- **OPTIONAL**: `.ux-assessments/<project>-*.json` — latest UX Assessment Report (if exists, incorporate findings into validation context)

For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

#### UX Assessment Report Integration

If a `.ux-assessments/<project>-<date>.json` file exists for the target project:
1. Load the most recent report (by date in filename)
2. Include its `summary.topIssues` in validation context — these are known UX issues to verify or flag
3. Reference its `antiPatterns.findings` when checking component quality
4. Use its `accessibility.score` as baseline — flag regressions if re-running
5. Append a "UX Assessment Summary" section to the final validation report:
   ```
   ## UX Assessment Summary (automated)
   Overall: {overallScore}/100 ({rating})
   Anti-patterns: {score}/4 | Accessibility: {score}/4 | Performance: {score}/100
   Top issues: {list topIssues descriptions}
   ```

### 2. Extract Validation Scenarios from quickstart.md

Parse quickstart.md and extract:
- **Routes/URLs** mentioned (e.g., `/manage-apim`, `/connect-apim`)
- **UI element references** (button labels, section headers, form fields, status badges)
- **Interaction sequences** (click X → see Y → fill Z → submit)
- **Expected outcomes** (success messages, state changes, displayed values)

Build a structured validation plan:

```
| # | Route | Action | Expected Element/Behavior | Source Line |
|---|-------|--------|---------------------------|-------------|
| 1 | /manage-apim | Navigate | "Manage APIM Instance" heading visible | quickstart.md:L42 |
| 2 | /manage-apim | Click "Rotate Subscription Key" | Panel opens with Primary/Secondary buttons | quickstart.md:L48 |
```

Then build a mandatory step coverage matrix that maps each quickstart numbered step to one of:
- `Automatable now`
- `Partially automatable (UI/local only)`
- `Manual required (external Azure setup)`

Never omit a quickstart step from this matrix.

### 3. Ensure Application is Running

Check if the dev server is already running:
- Look for an active terminal running `ng serve` or equivalent
- If not running, start the dev server using the command from plan.md (typically `npm start` or `npx ng serve`)
- Wait for the server to be ready (check for "compiled successfully" or equivalent message)
- Note the port (default 4200, or as configured)

### 4. Execute Validation Scenarios

For each scenario in the validation plan:

1. **Navigate** to the target route using `open_browser_page`
2. **Screenshot** the initial state using `screenshot_page`
3. **Read** the page content using `read_page` to extract actual text/labels
4. **Compare** actual UI elements against quickstart.md expectations:
   - Element existence (is the button/heading/section present?)
   - Label accuracy (does the text match what documentation says?)
   - Element type (is it a button vs expandable section vs link?)
   - Interaction model (click → form appears vs click → section expands)
5. **Interact** with elements using `click_element`, `type_in_page` where applicable
6. **Verify** post-interaction state matches documented expectations
7. **Screenshot** the result state for evidence

For scenarios that need Azure resources not currently available:
1. Execute all locally-testable checks first (UI controls, required fields, validation behavior, button states, progress/error rendering).
2. Mark backend/resource-dependent assertions as `MANUAL_REQUIRED` instead of skipping.
3. Capture at least one screenshot showing the exact UI location where the manual action must start.

### 5. Produce Validation Report

Output a structured Markdown report:

```markdown
## UI Validation Report

**Feature**: {feature name from plan.md}
**Date**: {current date}
**Dev Server**: {url}
**Status**: {PASS | FAIL | PARTIAL}

### Summary

| Metric | Value |
|--------|-------|
| Total Scenarios | N |
| Passed | N |
| Failed | N |
| Partial | N |
| Manual Required | N |
| Blocked | N |

### Discrepancies Found

| # | Severity | Location | Documentation Says | UI Actually Shows | Recommendation |
|---|----------|----------|--------------------|-------------------|----------------|
| 1 | MEDIUM | quickstart.md:L52 | "expand Rate Limit Policy section" | Button labeled "Update Rate Limits" shows form below | Fix documentation |
| 2 | HIGH | quickstart.md:L60 | "Click Read Current Policy" | Button labeled "Read Current" | Fix documentation |

### Screenshots

- [Step 1] Initial /manage-apim load: ✓ Matches
- [Step 2] After clicking "Update Rate Limits": Form appears (documented as expandable section)

### Quickstart Coverage Matrix

| Quickstart Step | Title | Status | Automation Level | Evidence | Notes |
|-----------------|-------|--------|------------------|----------|-------|
| 2 | Validate Configure Observability | PARTIAL | UI/local + manual Azure | screenshot ref | Portal/resource assertions require manual completion |
| 5 | Validate Alert Rules with Action Group | MANUAL_REQUIRED | manual Azure | screenshot ref | Action Group creation required |

### Manual Validation Playbook

For every `MANUAL_REQUIRED` or `PARTIAL` step include:

| Step | Why Manual | Prerequisites | Exact Actions | Expected Result | Evidence to Capture |
|------|------------|---------------|---------------|-----------------|---------------------|
| 5 | Requires Azure Action Group + live alerts | Contributor role, APIM deployed, action group id | 1) Create action group ... 2) run Configure Observability ... | alert rules reference action group | portal screenshot + resource IDs |

Manual playbook quality bar:
- Actions must be executable as written (no vague "set up Azure").
- Include concrete field names/routes/buttons from the UI.
- Include objective pass criteria.

### Detailed Results

#### Scenario 1: {description}
- **Route**: {url}
- **Action**: {what was done}
- **Expected**: {from quickstart.md}
- **Actual**: {from browser}
- **Status**: PASS | FAIL
- **Evidence**: {screenshot reference}
```

### 6. Severity Classification

- **CRITICAL**: Feature documented but not implemented (missing route, missing functionality)
- **HIGH**: Interaction model wrong (docs say "expand section" but it's a button + form), or element missing
- **MEDIUM**: Label/text mismatch (docs say "Read Current Policy", UI says "Read Current")
- **LOW**: Minor wording differences, styling differences not affecting functionality

### 7. Remediation

Based on discrepancies found, offer:

**Option A — Fix Documentation** (preferred when UI is correct):
- Generate exact edits to quickstart.md that align documentation with actual UI behavior
- Show diff preview before applying

**Option B — Fix Implementation** (when UI is broken):
- Identify which tasks/components need correction
- Suggest handoff to `speckit.implement` with specific fix instructions

**Option C — Mixed** (some docs wrong, some UI wrong):
- Categorize each discrepancy and propose the appropriate fix direction

Ask user: "I found N discrepancies. Would you like me to: (A) Fix documentation to match UI, (B) Flag UI issues for re-implementation, or (C) Review each individually?"

If manual steps remain, also ask:
"I identified N steps that require external Azure setup. Do you want me to generate a copy-paste manual test checklist for your environment (subscription/resource group/APIM names)?"

### 8. Apply Approved Fixes

If user approves documentation fixes:
- Edit quickstart.md with corrected descriptions
- Ensure the fix preserves the document's structure and validation checklist format
- Re-run affected validation scenarios to confirm the fix is accurate

### 9. Final Gate Check

After all fixes are applied:
- Re-validate all previously-failed scenarios
- Confirm final PASS/FAIL status
- Confirm every numbered quickstart step has a final status (none missing)
- If all pass, mark validation as complete

Output:
```
## Validation Complete

All N scenarios validated successfully.
Documentation is aligned with implementation.
Ready for: /speckit.analyze (consistency check) or PR review.
```

If any step is `MANUAL_REQUIRED` or `PARTIAL`, use:
```
## Validation Complete (Automation + Manual Follow-up)

Automated validation finished. X steps passed automatically.
Y steps require manual Azure verification with the included playbook.
No quickstart steps were skipped silently.
```

### 10. Check for extension hooks

After validation completes, check if `.specify/extensions.yml` exists:
- If it exists, read it and look for entries under the `hooks.after_validate` key
- Process hooks using the same logic as pre-execution hooks
- For each executable hook, output based on `optional` flag (same format as above)
- If no hooks registered or file doesn't exist, skip silently
