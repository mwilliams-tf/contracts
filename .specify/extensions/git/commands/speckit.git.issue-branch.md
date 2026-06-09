---
description: "Create or switch to an issue implementation branch with chained ancestry"
---

# Create Issue Branch

Create and switch to a git branch for implementing a specific GitHub issue. Branches follow the pattern `issue/{id}-{keywords}` and are chained sequentially — each issue branch is based on the previous issue's branch (or the feature branch for the first issue).

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Parameters

The caller provides:
- **issue_number**: The GitHub issue number (e.g., `75`)
- **keywords**: Slug-friendly keywords for the branch name (e.g., `operation-tracker-service`)
- **base_branch** (optional): Explicit base branch. If omitted, the command auto-detects from issue chain.

## Prerequisites

- Verify Git is available: `git rev-parse --is-inside-work-tree 2>/dev/null`
- Working tree must be clean (no uncommitted changes). If dirty:
  - Warn: "Working tree has uncommitted changes. Commit or stash before switching branches."
  - **STOP** — do not create the branch.

## Branch Name Construction

```
issue/{issue_number}-{keywords}
```

Rules:
- `keywords` must be lowercase, alphanumeric + hyphens only
- Strip leading/trailing hyphens
- Max 50 characters for keywords (truncate at word boundary)
- Examples: `issue/75-operation-tracker-service`, `issue/76-provisioning-integration`

## Base Branch Resolution

Determine which branch to base the new issue branch on:

1. **If `base_branch` is explicitly provided** → use it directly
2. **If issue-mapping.yml exists** → load the mapping for the current feature, find the previous issue in declaration order, check if its branch `issue/{prev_id}-*` exists locally or in remotes
3. **If no previous issue branch exists** → use the current feature branch (detected from current HEAD or from `git branch --show-current`)

**Resolution algorithm**:
```
feature_branch = current branch matching pattern `NNN-*` or `feature/*`
issues_in_order = ordered list from issue-mapping.yml for this feature
current_issue_index = position of this issue in issues_in_order

if current_issue_index == 0:
    base = feature_branch
else:
    prev_issue = issues_in_order[current_issue_index - 1]
    prev_branch = find branch matching `issue/{prev_issue.number}-*`
    if prev_branch exists:
        base = prev_branch
    else:
        base = feature_branch
```

## Execution

1. Resolve the target branch name: `issue/{issue_number}-{keywords}`
2. Check if branch already exists:
   - **Locally**: `git rev-parse --verify issue/{issue_number}-{keywords} 2>/dev/null`
   - If exists → `git checkout issue/{issue_number}-{keywords}` and report "Switched to existing branch"
   - If not → continue to creation
3. Resolve the base branch (see algorithm above)
4. Create and switch:
   ```bash
   git checkout -b "issue/{issue_number}-{keywords}" "{base_branch}"
   ```
5. Report result

## Output

```
## Issue Branch

- **Branch**: `issue/{issue_number}-{keywords}`
- **Based on**: `{base_branch}`
- **Action**: Created / Switched to existing
- **Issue**: #{issue_number}
```

## Error Handling (Hard Stop)

- If Git is not available → **STOP** with error: "Git is required for issue branch management. Install Git or ensure this is a Git repository."
- If base branch doesn't exist locally → attempt `git fetch origin {base_branch}` then retry; if still missing → **STOP** with error: "Base branch `{base_branch}` not found locally or in remote. Ensure previous issue branches have been pushed."
- If branch creation fails for any reason → **STOP** with error message and do not proceed with implementation
