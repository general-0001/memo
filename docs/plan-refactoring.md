# Refactoring Plan (Hybrid Feature Layers)

## 1. Feature Boundary Reorganization
- **Objective**: Reintroduce full layer structure (`presentation/application/domain/infrastructure`) under each feature and establish `index.ts` as the minimal public interface.
- **Scope**:
  - Create `index.ts` files for `app`, `categories`, `memos` features.
  - Relocate current services/stores into proper layer folders.
  - Introduce domain model placeholders where behaviour is business-specific.
- **Key Tasks**:
  1. Scaffold missing directories and move existing application logic into them.
  2. Define public API surface via `index.ts` exports.
  3. Update imports across pages/components to consume the new public surface.
- **Risks & Mitigations**:
  - *Broken imports*: run typecheck and adjust aliases immediately.
  - *Hidden circular deps*: keep domain types pure and decouple application from infrastructure via ports.
- **Acceptance Criteria**:
  - No direct imports from internal files outside of each feature.
  - `pnpm typecheck` passes with new structure.

## 2. Presentation Layer Relocation
- **Objective**: Move UI composition and state wiring into each feature's `presentation` layer to respect slice boundaries.
- **Scope**:
  - Rehouse `AppPanel*` components and related page logic under the `memos`/`categories` presentation folders.
  - Provide lightweight wrappers in `app/pages` that delegate to feature presentation.
- **Key Tasks**:
  1. Transfer Vue components into feature-owned presentation folders, adjusting aliases.
  2. Convert current pages to import from feature presentation via `index.ts`.
  3. Ensure CSS classes (`app_*`) remain intact per template contract.
- **Risks & Mitigations**:
  - *Layout regression*: verify rendered structure visually or via Storybook snapshot (manual check this iteration).
  - *State coupling*: expose only needed hooks/components from presentation entry points.
- **Acceptance Criteria**:
  - Pages/components only depend on feature presentation entry points.
  - UI behaviour remains functionally equivalent (manual smoke test).

## 3. Infrastructure Adapter Extraction
- **Objective**: Isolate Dexie/Broadcast/seed logic as adapters within each feature infrastructure layer, using application ports.
- **Scope**:
  - Introduce ports for memo/category persistence and sync.
  - Move Dexie access and BroadcastChannel usage into infrastructure adapters.
  - Retain shared helpers (`extractTags`) where they are truly cross-cutting.
- **Key Tasks**:
  1. Define interfaces (ports) in application/domain for data access & sync.
  2. Implement adapters using existing Dexie utilities and register them for dependency injection (factory pattern for now).
  3. Update application layer to depend on ports instead of concrete Dexie utilities.
- **Risks & Mitigations**:
  - *Over-abstraction*: keep ports minimal (CRUD + sync events) and avoid premature generalization.
  - *Runtime errors during refactor*: incremental commits with frequent typechecks.
- **Acceptance Criteria**:
  - Application layer uses port abstractions only.
  - Dexie/Broadcast logic resides under `infrastructure` directories.

## 4. Store Responsibility Slimming & Shared Cleanup
- **Objective**: Reduce `memoApp.store` responsibilities, delegate CRUD/search to feature application services, and minimise shared surface.
- **Scope**:
  - Split state management per feature where possible (memo vs category, search/search view).
  - Ensure shared utilities contain only cross-feature concerns.
- **Key Tasks**:
  1. Create dedicated controllers/use-cases invoked by presentation layer.
  2. Move feature-specific helpers out of `shared` into respective domains.
  3. Update presentation logic to compose smaller stores/services.
- **Risks & Mitigations**:
  - *State fragmentation*: document new orchestrator responsibilities clearly.
  - *Regression in search/filter*: maintain existing derived state through computed wrappers.
- **Acceptance Criteria**:
  - `memoApp.store` (or successor) no longer handles infrastructure or sync wiring directly.
  - Shared directory contains only generic utilities (types, tag extraction, etc.).

---

**Validation Plan**
- Execute `pnpm typecheck` after each major subsection to catch regressions early.
- Manual smoke test: create/edit/delete memo & category, ensure BroadcastChannel sync remains operational.
- Document follow-up tasks for automation/tests if time constraints prevent full coverage now.
