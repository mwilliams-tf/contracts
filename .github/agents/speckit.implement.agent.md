---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
handoffs:
  - label: Run UX Audit
    agent: speckit.ux-audit
    prompt: Run a full UX quality audit on the implemented UI projects
    send: true
  - label: Validate UI Against Docs
    agent: speckit.validate
    prompt: Validate that the implemented UI matches quickstart.md documentation
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before implementation)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_implement` key
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

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     - Completed items: Lines matching `- [X]` or `- [x]`
     - Incomplete items: Lines matching `- [ ]`
   - Create a status table:

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```

   - Calculate overall status:
     - **PASS**: All checklists have 0 incomplete items
     - **FAIL**: One or more checklists have incomplete items

   - **If any checklist is incomplete**:
     - Display the table with incomplete item counts
     - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     - Wait for user response before continuing
     - If user says "no" or "wait" or "stop", halt execution
     - If user says "yes" or "proceed" or "continue", proceed to step 3

   - **If all checklists are complete**:
     - Display the table showing all checklists passed
     - Automatically proceed to step 3

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read .specify/memory/constitution.md for governance constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios

4. **Project Setup Verification**:
   - **REQUIRED**: Create/verify ignore files based on actual project setup:

   **Detection & Creation Logic**:
   - Check if the following command succeeds to determine if the repository is a git repo (create/verify .gitignore if so):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Check if Dockerfile* exists or Docker in plan.md → create/verify .dockerignore
   - Check if .eslintrc* exists → create/verify .eslintignore
   - Check if eslint.config.* exists → ensure the config's `ignores` entries cover required patterns
   - Check if .prettierrc* exists → create/verify .prettierignore
   - Check if .npmrc or package.json exists → create/verify .npmignore (if publishing)
   - Check if terraform files (*.tf) exist → create/verify .terraformignore
   - Check if .helmignore needed (helm charts present) → create/verify .helmignore

   **If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
   **If ignore file missing**: Create with full pattern set for detected technology

   **Common Patterns by Technology** (from plan.md tech stack):
   - **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `*.dll`, `autom4te.cache/`, `config.status`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Swift**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
   - **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Tool-Specific Patterns**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

5. Parse tasks.md structure and extract:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements
   - **Issue grouping**: Which tasks belong to which issue (from "Issue N:" sections)

6. **Issue Branch Management** (automatic):

   Before executing tasks for each issue, create or switch to its dedicated branch.
   Branch pattern: `issue/{id}-{keywords}` (e.g., `issue/75-operation-tracker-service`).

   **Determine implementation scope**:
   - If user specified a particular issue (e.g., "implement issue #75") → single-issue mode
   - If no specific issue → multi-issue mode (implement all issues sequentially)

   **For each issue to implement** (in dependency order from tasks.md):

   a. **Resolve issue metadata**:
      - Load `.specify/issue-mapping.yml` to get issue numbers and their declaration order
      - Derive `keywords` from the issue title: lowercase, replace spaces with hyphens, strip non-alphanumeric characters, truncate to 50 chars at word boundary
      - Example: "Implement OperationTrackerService" → `operation-tracker-service`

   b. **Determine base branch**:
      - First issue in chain → base off current feature branch (the branch you're on when implement starts)
      - Subsequent issues → base off the previous issue's branch (`issue/{prev_id}-{prev_keywords}`)
      - If the previous issue's branch doesn't exist locally, attempt `git fetch origin` and check again; if still missing, fall back to feature branch

   c. **Create or switch to issue branch**:
      - Check working tree is clean. If dirty → auto-commit with message: `[speckit] WIP: progress on issue #{prev_id}` before switching
      - If `issue/{id}-{keywords}` already exists → `git checkout issue/{id}-{keywords}`
      - If not → `git checkout -b "issue/{id}-{keywords}" "{base_branch}"`

   d. **Report branch state**:
      ```
      ## Issue Branch

      - **Branch**: `issue/{id}-{keywords}`
      - **Based on**: `{base_branch}`
      - **Action**: Created / Switched to existing
      - **Issue**: #{id} — {title}
      ```

   e. **After completing all tasks for this issue**:
      - Auto-commit remaining changes: `[speckit] Implement #{id}: {title}`
      - Proceed to next issue (repeat from step a)

   **Error handling** (hard stop):
   - If Git is unavailable → **STOP** with error: "Git is required for issue branch management. Install Git or ensure this is a Git repository."
   - If branch creation fails → **STOP** with error: "Failed to create branch `issue/{id}-{keywords}`. Resolve the issue and retry."
   - If working tree cannot be cleaned → **STOP** and ask user to commit or stash manually before proceeding

7. Execute implementation following the task plan:
   - **Issue-by-issue execution**: Complete all tasks for one issue before moving to the next
   - **Phase-by-phase within issue**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together  
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   - **Branch per issue**: All commits for an issue land on its `issue/{id}-*` branch
   - **Validation checkpoints**: Verify each phase completion before proceeding

8. Implementation execution rules:
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish and validation**: Unit tests, performance optimization, documentation

9. Progress tracking and error handling:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** For completed tasks, make sure to mark the task off as [X] in the tasks file.

10. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original specification
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary of completed work

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/speckit.tasks` first to regenerate the task list.

11. **Slack Update Suggestion**:

   After completing a phase or set of tasks, generate a **copy-paste-ready Slack update** for team tracking.

   **Gather context**:
   - Identify the user story(ies) or phase(s) completed from task markers
   - Get the GitHub repo from: `git config --get remote.origin.url` (extract `owner/repo`)
   - **Load the issue mapping from `.specify/issue-mapping.yml`** to resolve issue numbers
   - Extract the story/phase title and priority from tasks.md
   - Include the issue branch name in the update context

   **Generate the message in this exact format**:

   ````markdown
   ---
   ### 📋 Suggested Slack Update

   **Parent message** (creates thread):
   ```
   :icrnormal: Updates on {US-ID}: {Story Title} ({Priority}) · Issue #{issue_number} · {owner/repo}
   ```
   > 💡 Link the text above to: `https://github.com/{owner/repo}/issues/{issue_number}`

   **Thread reply** (paste as reply in the thread):
   ```
   {Resumen conciso en español de lo entregado. Enfocarse en la funcionalidad y el resultado, no en archivos específicos. 2-3 oraciones naturales.}
   ```
   ---
   ````

   **Rules for the thread reply**:
   - Write in **Spanish**
   - Keep it concise: 2-3 sentences max
   - Focus on **what capability was delivered** and **what now works**, not on implementation details
   - Avoid listing filenames, function names, or internal technical references unless they are essential for the reader to understand the change
   - If tests were added, a brief mention is enough (e.g., "con tests unitarios")

   **If multiple user stories were completed**, generate one Slack update per story.

   **If no GitHub issue number is available** (mapping file missing or entry not found), use `#?` as placeholder and log a warning: "Issue mapping not found in `.specify/issue-mapping.yml` — ensure `speckit.taskstoissues` was run to populate the mapping."

12. **Check for extension hooks**: After completion validation, check if `.specify/extensions.yml` exists in the project root.
    - If it exists, read it and look for entries under the `hooks.after_implement` key
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

13. **Phase-level Slack updates**: If the implementation was stopped mid-way (only some phases completed), still generate the Slack update for the completed phases before stopping. The update should reflect only what was actually delivered in this session.

14. **UI Validation Recommendation**: If the feature includes UI components (check for files in `features/`, HTML templates, or routes in the plan):
    - Output the following recommendation:

    ```
    ## Next Steps: UX Quality & Validation

    This feature includes UI components. The following agents handle quality validation automatically:

    ### 1. UX Audit → `/speckit.ux-audit`
    Runs the full automated pipeline in one step:
    - Anti-pattern detection (Impeccable CLI)
    - Accessibility audit (axe-core via Karma)
    - Visual regression (BackstopJS)
    - Performance budgets (Lighthouse CI)
    - Design token compliance
    - Consolidated report to `.ux-assessments/`

    ### 2. UI Validation → `/speckit.validate`
    Verifies the implemented UI matches quickstart.md documentation using Playwright.

    Both are available as handoffs from this agent.
    ```
    - Suggest using the "Run UX Audit" handoff button directly.
