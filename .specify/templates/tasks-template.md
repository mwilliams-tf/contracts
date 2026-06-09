---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Constitution**: MVP demo-first; bounded contexts (CLM vs Chat IA); fictitious data with
real UX flow; Spanish UI; no real integrations. Stop at checkpoints to validate the
~3 min demo narrative before expanding scope.

**Organization**: Tasks are grouped by issue scope. Each top-level section maps to one GitHub issue for tracking and reporting.

---

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by issue scope so each issue can be:
  - Implemented independently (after its dependencies)
  - Tested independently
  - Reported on as a meaningful unit of work

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Issue 1: [Core service/infrastructure name]

**Scope**: Project initialization, foundational models/types, and core service with all public methods and unit tests. This is the foundation — all subsequent work depends on it.

### Setup

- [ ] Create project structure per implementation plan
- [ ] Initialize [language] project with [framework] dependencies
- [ ] [P] Configure linting and formatting tools

### Core Implementation

- [ ] Setup database schema and migrations framework
- [ ] [P] Implement authentication/authorization framework
- [ ] [P] Setup API routing and middleware structure
- [ ] Create base models/entities that all stories depend on
- [ ] Configure error handling and logging infrastructure
- [ ] Setup environment configuration management

### Unit Tests

- [ ] Write unit tests for [core service]: [key scenarios] in [test file path]

**Checkpoint**: Foundation ready — integration work can begin.

---

## Issue 2: [Primary integration / core value delivery]

**Scope**: Integration of the core service with consumers, covering the primary user-facing value.

### Tests (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] [P] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] [P] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation

- [ ] [P] Create [Entity1] model in src/models/[entity1].py
- [ ] [P] Create [Entity2] model in src/models/[entity2].py
- [ ] Implement [Service] in src/services/[service].py
- [ ] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] Add validation and error handling
- [ ] Handle [edge case] in src/[location]/[file].py

**Checkpoint**: Primary value delivered — [describe what works now].

---

## Issue 3: [Secondary capabilities]

**Scope**: Additional features that complement the core value. Can be worked in parallel with Issue 2 after Issue 1 is complete.

### Tests (OPTIONAL) ⚠️

- [ ] [P] Write test: [scenario] in tests/[path].py
- [ ] [P] Write test: [scenario] in tests/[path].py

### Implementation

- [ ] [P] Create [Entity] model in src/models/[entity].py
- [ ] Implement [Service] in src/services/[service].py
- [ ] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] Integrate with [component from Issue 1] if needed

**Checkpoint**: [Describe what additionally works now].

---

## Issue 4: [Lower-priority features] and final validation

**Scope**: Remaining scope plus cross-cutting validation and polish.

### Implementation

- [ ] Implement [lower-priority feature] in src/[location]/[file].py
- [ ] Handle [edge case] in src/[location]/[file].py

### Final Validation

- [ ] [P] Verify all existing tests still pass (no regression)
- [ ] [P] Run full test suite and fix any failures
- [ ] Verify [specific mode/path] is unaffected by changes
- [ ] [P] Run quickstart.md validation

**Checkpoint**: All scope delivered. Full test suite green. No regressions.

---

## Dependencies & Execution Order

### Issue Dependencies

```
Issue 1 ([core service/infrastructure])
  ↓ blocks
Issue 2 ([primary integration])  ←─ can start immediately after Issue 1
Issue 3 ([secondary capabilities])  ←─ can start in parallel with Issue 2
Issue 4 ([remaining scope + validation])  ←─ can start in parallel with Issues 2 & 3
```

### Execution Rules

- Tests MUST be written and FAIL before implementation
- Models/types before service logic
- Service logic before component/endpoint integration
- Core path before edge cases

### Parallel Opportunities

- All tasks marked [P] can run in parallel within their issue
- Issues 2, 3, and 4 are fully independent once Issue 1 is complete
- Different issues touching different files can be assigned to different contributors

---

## Parallel Example: Issue 2

```bash
# Launch all tests together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (Issue 1 + Issue 2)

1. Complete Issue 1: Core service/infrastructure
2. Complete Issue 2: Primary integration
3. **STOP and VALIDATE**: Test the core value independently; confirm ~3 min demo path,
   *datos ficticios* marker, and in-progress/pending contract prioritization
4. Demo to Legal stakeholders if ready; defer product integrations to IT phase

### Incremental Delivery

1. Issue 1 → Foundation ready
2. Issue 2 → Core value delivered → Deploy/Demo (MVP!)
3. Issue 3 → Secondary capabilities → Deploy/Demo
4. Issue 4 → Remaining scope + validation → Feature complete

### Parallel Team Strategy (3 Contributors)

This project has **3 contributors** working in parallel. Task assignment MUST minimize cross-contributor blocking.

**Principles**:
- No contributor should be blocked waiting for another contributor's incomplete issue
- Issues assigned to different contributors MUST NOT have inter-issue dependencies
- If an issue truly requires output from another, assign both to the same contributor or sequence them within the same contributor's lane

**Assignment pattern**:

1. All contributors collaborate on Issue 1 (short, blocking foundation)
2. Once Issue 1 is done, assign remaining issues so each lane is self-contained:
   - Contributor A: [Issue(s) with no dependency on B or C's work]
   - Contributor B: [Issue(s) with no dependency on A or C's work]
   - Contributor C: [Issue(s) with no dependency on A or B's work]
3. If a dependency chain exists between issues, assign both to the SAME contributor
4. All contributors converge at final validation

**Anti-pattern to AVOID**:
> ❌ "Contributor B implements Issue 3 but waits for Contributor A to finish Issue 2"

This creates idle time and merge conflicts. Instead, either:
- Assign Issue 2 + Issue 3 to the same contributor, OR
- Redesign Issue 3 tasks to be independent of Issue 2 (extract shared foundations into Issue 1)

---

## Issue Mapping for GitHub

> Guides `speckit.taskstoissues` on how to create GitHub issues from this document.

| Issue Title | Scope | Priority |
|-------------|-------|----------|
| [Core service/infrastructure name] | Models, types, core logic, unit tests | P1 — blocking |
| [Primary integration] | Service delegation, integration, [key aspect] | P1 — core value |
| [Secondary capabilities] | [Component] indicator, [feature] handling | P3 |
| [Lower-priority feature] and final validation | [Feature], regression suite | P4 |

---

## Notes

- [P] tasks = different files, no dependencies — can run in parallel
- Each issue should be independently completable and testable (after its dependencies)
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
