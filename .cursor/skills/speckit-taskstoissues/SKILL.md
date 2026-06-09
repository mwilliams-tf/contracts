---
name: "speckit-taskstoissues"
description: "Convert existing tasks into actionable, dependency-ordered GitHub issues for the feature based on available design artifacts."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/taskstoissues.md"
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before tasks-to-issues conversion)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_taskstoissues` key
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

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load and group tasks**: From the executed script, extract the path to **tasks.md**. Read and parse all tasks, extracting:
   - Full task description with file paths
   - Parallelization marker [P] if present
   - Section membership (which issue section the task belongs to)

   **Group tasks into issues** using the **Issue Mapping for GitHub** table at the bottom of tasks.md:

   - If tasks.md contains an `## Issue Mapping for GitHub` section with a mapping table, use it as the primary grouping guide:
     - Each row in the table represents one GitHub issue
     - The "Issue Title" column is the exact title to use for the GitHub issue
     - The "Scope" column describes which sections of tasks.md belong to this issue
     - Match tasks to issues by their section headers in the document
   - If NO mapping table exists, fall back to grouping by top-level `## Issue` or `## Phase` headers in tasks.md, using the header text as the issue title

   Each group becomes **one GitHub issue**. The individual tasks within the group become **acceptance criteria checkboxes** in that issue's body.

3. **Resolve repository**: Get the Git remote by running:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> ONLY PROCEED TO NEXT STEPS IF THE REMOTE IS A GITHUB URL

Extract `owner` and `repo` from the remote URL.

> [!CAUTION]
> UNDER NO CIRCUMSTANCES EVER CREATE ISSUES IN REPOSITORIES THAT DO NOT MATCH THE REMOTE URL

4. **Deduplication check**: Search for existing issues that were previously created by this workflow:

```bash
gh issue list --repo {owner}/{repo} --state all --search "in:body speckit.taskstoissues" --json number,title,body,state,labels --limit 200
```

Build a lookup map of `issue title → existing issue number` by matching the issue title from the mapping table against existing issues. Use fuzzy title matching (case-insensitive, ignore leading/trailing whitespace).

5. **Issue sync** (for each task group):

   **A. If an issue already exists for this group**:
   - Compare the grouped task descriptions from tasks.md against the existing issue body
   - If content has materially changed (tasks added/removed/modified, file paths, or dependencies changed): **update** the existing issue using the GitHub MCP server
   - If content is unchanged: **skip** (no operation needed)
   - Log: `⟳ Updated #{number}: {title}` or `✓ Unchanged #{number}: {title}`

   **B. If no existing issue matches this group**:
   - **Create** a new issue using the GitHub MCP server (see Issue Format below)
   - Log: `✚ Created #{number}: {title}`

6. **Project board integration**: After creating or updating each issue, add it to the GitHub Project board:

```bash
gh project item-add 45 --owner {owner} --url https://github.com/{owner}/{repo}/issues/{number}
```

> [!NOTE]
> If the issue is already on the board, this command is idempotent (no duplicate entries).

7. **Persist issue mapping**: After successfully creating or updating each issue:
   - Load the existing `.specify/issue-mapping.yml` file (create if missing)
   - Add or update the entry for this issue under the feature directory:
     ```yaml
     {feature_dir}:
       {slugified_title}:  # e.g., implement-operation-tracker-service
         issue_number: {number}
         title: {GitHub issue title}
         url: https://github.com/{owner}/{repo}/issues/{number}
         synced_at: {ISO 8601 timestamp}
     ```
   - Save the updated YAML back to `.specify/issue-mapping.yml`
   - Log: `💾 Persisted mapping: {title} → #{issue_number}`

8. **Report**: Output a summary table:
   - Total task groups processed
   - Total tasks across all groups
   - Issues created (new)
   - Issues updated (changed)
   - Issues unchanged (skipped)
   - Issues added to project board
   - Any errors encountered

## Issue Format

Each issue represents a **logical scope of work**, NOT an individual task. Tasks become acceptance criteria within the issue.

### Title Format

Use the **exact title** from the "Issue Mapping for GitHub" table in tasks.md. Titles must be:
- Clean and descriptive — communicate what the issue delivers
- Free of prefixes, tags, or metadata (no `[speckit]`, `[US1]`, `Phase:`, etc.)
- Understandable by any contributor without needing to reference spec documents

**Examples of good titles**:
- `Implement OperationTrackerService`
- `Integrate tracker with provisioning workflow`
- `Entry-point indicator and token-expiry handling`
- `Page reload resume and final validation`

**Examples of BAD titles (DO NOT USE)**:
- ❌ `[speckit] [US1] Configure Observability on Existing APIM`
- ❌ `[speckit] [Phase:Setup] Create Bicep module`
- ❌ `US3+US4: Post-action navigation`

### Body (Markdown)

```markdown
## Overview

{Brief description of what this issue delivers and why it matters. 2-3 sentences max.}

## Acceptance Criteria

{For each task in this group, render as a checkbox:}

- [ ] {Full task description with file path}
- [ ] {Full task description with file path}
- [ ] ...

## Context

- **Priority**: {P1/P2/P3/P4 from the mapping table}
- **Dependencies**: {Which other issues must be completed first, by title}
- **Parallelizable tasks**: {Count of tasks marked with [P]}
- **Files affected**: {Deduplicated list of file paths mentioned across all tasks in this group}

---
<sub>Managed by speckit.taskstoissues · Source: {relative path to tasks.md}</sub>
```

### Labels

Apply ONLY functional labels that help filter and prioritize work:
- `priority:{P1|P2|P3|P4}` — Priority from the mapping table
- `feature:{feature-name}` — Feature identifier derived from the spec directory name (e.g., `feature:provisioning-operation-tracker`)

**DO NOT apply**:
- ❌ `speckit` — internal tooling metadata, no value for contributors
- ❌ `user-story:{N}` — internal spec structure, no value outside spec documents
- ❌ `phase:{name}` — internal planning structure, not actionable for filtering

## Deduplication Rules

1. **Identity**: An issue is uniquely identified by its title (from the Issue Mapping table in tasks.md)
2. **Matching**: When searching for existing issues, match by title similarity (case-insensitive). Also check if a previously existing issue title is a subset of a new consolidated issue — if so, close the old issue with a comment pointing to the new one.
3. **Update criteria**: An issue is considered "changed" if ANY of the following differ:
   - Tasks added or removed from the group
   - Task descriptions or file path references changed
   - Dependencies changed
4. **Closed issues**: If an existing issue is closed but the scope still exists in tasks.md, **reopen** it (the tasks were likely regenerated)
5. **Orphaned issues**: If an issue exists that was created by this workflow (check body for `speckit.taskstoissues` marker) but no longer maps to any scope in the current tasks.md, add a comment: `⚠️ This issue's scope was removed from tasks.md during regeneration. Review if this issue should be closed.` — Do NOT auto-close.
6. **Consolidation migration**: When previously separate issues are now covered by a single consolidated issue, close the old issues with a comment: `🔗 Consolidated into #{new_issue_number} ({new_issue_title})` — then create or update the consolidated issue.

## Post-Execution Checks

**Check for extension hooks (after tasks-to-issues conversion)**:
Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.after_taskstoissues` key
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
