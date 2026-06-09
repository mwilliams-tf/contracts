---
name: "speckit-tasks"
description: "Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/tasks.md"
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before tasks generation)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_tasks` key
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
    
    Wait for the result of the hook command before proceeding to the Outline.
    ```
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-tasks.sh --json` from repo root and parse FEATURE_DIR, TASKS_TEMPLATE, and AVAILABLE_DOCS list. `FEATURE_DIR` and `TASKS_TEMPLATE` must be absolute paths when provided. `AVAILABLE_DOCS` is a list of document names/relative paths available under `FEATURE_DIR` (for example `research.md` or `contracts/`). For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories with priorities)
   - **Optional**: data-model.md (entities), contracts/ (interface contracts), research.md (decisions), quickstart.md (test scenarios)
   - Note: Not all projects have all documents. Generate tasks based on what's available.

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories with their priorities (P1, P2, P3, etc.)
   - If data-model.md exists: Extract entities and map to user stories
   - If contracts/ exists: Map interface contracts to user stories
   - If research.md exists: Extract decisions for setup tasks
   - Generate tasks organized by issue (see Task Generation Rules and Issue Consolidation Rules below)
   - Generate dependency graph showing issue completion order
   - Identify parallel execution opportunities
   - Validate task completeness (each issue scope is independently testable)
   - Validate that no cross-contributor blocking exists in the parallel assignment
   - Generate **Issue Mapping for GitHub** (see Issue Consolidation Rules below)

4. **Generate tasks.md**: Read the tasks template from TASKS_TEMPLATE (from the JSON output above) and use it as structure. If TASKS_TEMPLATE is empty, fall back to `.specify/templates/tasks-template.md`. Fill with:
   - Correct feature name from plan.md
   - One section per issue (grouped by logical scope, not 1:1 with user stories)
   - Within each issue section: scope description, subsections for related tasks (e.g., "Tests", "Implementation", "Models & Types")
   - All tasks must follow the strict checklist format (see Task Generation Rules below)
   - Clear file paths for each task
   - Dependencies section showing issue completion order as a graph
   - Parallel execution opportunities
   - Implementation strategy section with contributor parallel assignment as recommendation (see Team Parallelization rules)
   - Verify: no contributor lane contains a section that depends on another contributor's incomplete work
   - **Issue Mapping for GitHub** table at the bottom (see Issue Consolidation Rules)

5. **Report**: Output path to generated tasks.md and summary:
   - Total task count
   - Task count per issue
   - Parallel opportunities identified
   - Independent test criteria for each story
   - Suggested MVP scope (typically just the first 1-2 issues)
   - Format validation: Confirm ALL tasks follow the checklist format (checkbox, [P] marker, description with file path)

6. **Check for extension hooks**: After tasks.md is generated, check if `.specify/extensions.yml` exists in the project root.
   - If it exists, read it and look for entries under the `hooks.after_tasks` key
   - If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
   - Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
   - For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
     - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
     - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
   - For each executable hook, output the following based on its `optional` flag:
     - **Optional hook** (`optional: true`):
       ```
       ## Extension Hooks

       **Optional Hook**: {extension}
       Command: `/{command}`
       Description: {description}

       Prompt: {prompt}
       To execute: `/{command}`
       ```
     - **Mandatory hook** (`optional: false`):
       ```
       ## Extension Hooks

       **Automatic Hook**: {extension}
       Executing: `/{command}`
       EXECUTE_COMMAND: {command}
       ```
   - If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by issue scope to enable independent implementation and testing.

**Tests are OPTIONAL**: Only generate test tasks if explicitly requested in the feature specification or if user requests TDD approach.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [P?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
3. **Description**: Clear, actionable description with exact file path. Must be self-explanatory without needing external references.

**DO NOT include**:
- Sequential Task IDs (T001, T002...) — they add no value for contributors
- User story labels ([US1], [US2]...) — the issue grouping already communicates scope
- Phase labels or speckit metadata — internal concepts that don't belong in actionable tasks

**Examples**:

- ✅ CORRECT: `- [ ] Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] [P] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] T001 Create model` (no Task IDs)
- ❌ WRONG: `- [ ] [US1] Create User model` (no story labels)
- ❌ WRONG: `- [ ] Create model` (missing file path)

### Task Organization

1. **From User Stories (spec.md)** - PRIMARY ORGANIZATION:
   - Each user story (P1, P2, P3...) gets its own phase
   - Map all related components to their story:
     - Models needed for that story
     - Services needed for that story
     - Interfaces/UI needed for that story
     - If tests requested: Tests specific to that story
   - Mark story dependencies (most stories should be independent)

2. **From Contracts**:
   - Map each interface contract → to the user story it serves
   - If tests requested: Each interface contract → contract test task [P] before implementation in that story's phase

3. **From Data Model**:
   - Map each entity to the user story(ies) that need it
   - If entity serves multiple stories: Put in earliest story or Setup phase
   - Relationships → service layer tasks in appropriate story phase

4. **From Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Story-specific setup → within that story's phase

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before user stories)
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Tests (if requested) → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns

### Team Parallelization (3 Contributors)

This project has **3 contributors**. The generated Implementation Strategy section MUST:

1. **Default to a 3-contributor parallel assignment** instead of a single-contributor sequence
2. **Ensure zero cross-lane blocking**: If Contributor B's phase depends on Contributor A's output, they MUST be assigned to the same contributor or the shared dependency MUST be moved to Phase 2 (Foundational)
3. **Explicitly flag anti-patterns**: The strategy MUST NOT produce assignments where one contributor idles waiting for another's phase to complete
4. **Distribute phases evenly**: With N user-story phases and 3 contributors, aim for balanced load (e.g., 3 stories → 1 per contributor; 5 stories → 2+2+1)
5. **When dependencies force sequencing within one lane**: Assign the dependent chain to one contributor (e.g., if Phase 5 requires Phase 3, give both to Contributor A)
6. **Provide a single-contributor fallback** only as a secondary note, not the primary recommendation

**Anti-pattern to AVOID in generated output**:
> ❌ "Contributor B: Phase 5 (waits for Phase 3 to merge so X is available)"

This is idle time and defeats parallelism. Fix by restructuring the assignment or moving the blocking work to Foundational.

### Issue Consolidation Rules

The **Issue Mapping for GitHub** section at the bottom of tasks.md defines how tasks map to GitHub issues. Each issue represents one **reportable unit of work** — a meaningful delivery increment that justifies a status update.

The goal is to **minimize issue count** without losing plan quality. With Copilot-assisted velocity, tracking overhead per issue (reporting, status updates, board management) must be justified by the scope it represents.

**Consolidation Heuristics** — aggressively group into fewer issues:

1. **Setup + Foundational = 1 issue**: Models, types, and core service/infrastructure belong together as one deliverable. They are never useful independently.
2. **Related user stories = 1 issue**: Group stories that modify the same files, share the same priority tier, or represent complementary aspects of the same capability.
3. **Tail-end scope + validation = 1 issue**: Lower-priority features (P4) and cross-cutting polish/validation belong together — they represent the "finish and verify" phase.
4. **Target 3-5 issues per feature**: More than 5 issues for a single feature indicates over-fragmentation. Fewer than 3 may indicate an issue is too large to report on meaningfully.

**Never consolidate when**:
- Stories are independently assignable to different contributors AND their scope justifies separate reporting
- A story represents a significant architectural change that deserves its own tracking
- Consolidation would create an issue with >15 acceptance criteria checkboxes

**Output format** — Add this section at the bottom of tasks.md:

```markdown
## Issue Mapping for GitHub

> Guides `speckit.taskstoissues` on how to create GitHub issues from this document.

| Issue Title | Scope | Priority |
|-------------|-------|----------|
| Implement [core service/infrastructure] | Models, types, core logic, unit tests | P1 — blocking |
| Integrate [feature] with [consumer] | Service delegation, component integration, retention | P1 — core value |
| [Capability A] and [capability B] | Component X indicator, component Y handling | P3 |
| [Lower-priority feature] and final validation | Resume logic, regression suite | P4 |
```

**Rules for the mapping table**:
- **Issue Title**: Clean, descriptive title that communicates what the issue delivers. NO prefixes like `[speckit]`, `Phase:`, `US1`, or any internal metadata.
- **Scope**: Brief description of what's included — enough for a contributor to understand the boundary.
- **Priority**: Indicates blocking order and relative importance.
- Setup/Foundational tasks are ALWAYS merged into the first issue (core infrastructure).
- Polish/validation tasks are ALWAYS merged into the last issue.
- Aim for the minimum number of issues that still allows meaningful parallel work and clear reporting.
