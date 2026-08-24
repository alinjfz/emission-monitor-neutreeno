# Repository Instructions for Coding Agents

## Goal

Work efficiently in this repository while preserving its intentionally small, explicit architecture. Understand the existing implementation before changing it, reuse established helpers and components, and avoid repeatedly solving the same simple problem in different places.

## Start Here

Before making a non-trivial change:

1. Read the relevant section of `README.md`.
2. Search the repository with `rg` or `rg --files` before adding a file, helper, component, type, endpoint, dependency, or convention.
3. Read the closest existing implementation and its tests.

Treat the current code and approved contract documents as the source of truth. If they disagree, call out the mismatch rather than silently choosing one.

## Avoid Repetitive Work

- Search first. Do not recreate functionality that already exists under `frontend/src/lib`, `frontend/src/components/ui`, `frontend/src/features`, or `backend/app`.
- Reuse shared frontend helpers for API requests, dates, formatting, units, and risks. Keep API types centralized in `frontend/src/types/api.ts`.
- Reuse shadcn primitives from `frontend/src/components/ui`. Product-specific behavior belongs in a feature component, not in a copied primitive.
- Reuse backend dependencies, schemas, error handling, security helpers, and service patterns. Keep routes thin and transactions in services.
- When the same meaningful logic is needed in multiple places, extract one clearly named helper instead of copying it. Do not add abstractions for a one-off operation or introduce a generic repository layer.
- Batch related reads, searches, edits, and verification commands. Do not repeatedly reopen unchanged files or rerun the same check without a reason.
- Fix the underlying source of generated or derived output. Do not hand-edit build artifacts, caches, coverage output, database files, or dependency directories.
- Make the smallest coherent change. Avoid drive-by refactors, formatting unrelated files, or rewriting working code merely to match a personal preference.

## Architecture Boundaries

### Frontend

- Keep code feature-oriented under `frontend/src/features`.
- Use `frontend/src/lib/api-client.ts` as the single fetch wrapper.
- Keep server field names in `snake_case`; do not add an automatic casing-conversion layer.
- Preserve URL ownership of search, status, sorting, pagination, view, and selected-detail state.
- Preserve local-storage ownership of display preferences and local component ownership of comment drafts.
- Exact decimal values arrive as strings and must not be converted to JavaScript `Number`.
- Date-only calculations must use the existing UTC-safe date utilities.
- Prefer existing React state and hooks. Do not add Redux, TanStack Query, form frameworks, or validation frameworks unless the task explicitly requires an architectural change.

### Backend

- Routes handle HTTP concerns; services handle use cases, transactions, and state transitions; schemas define API input/output; models define persistence.
- Use synchronous FastAPI handlers and SQLAlchemy sessions, matching the existing execution model.
- Perform a submission state change and its review-event insert in the same transaction.
- Preserve optimistic concurrency through `expected_version` and HTTP 409 responses containing the latest submission.
- Preserve the exactly-one-`opened`-event invariant in both application logic and the database constraint.
- Use Alembic for every schema change. Never patch the SQLite database directly.
- Keep queries parameterized, sort keys allowlisted, and literal-search wildcard escaping intact.
- Never expose internal exceptions, SQL, stack traces, password hashes, or session tokens in API responses.

## Product Invariants

- Review history is append-only.
- `last_modified_at` is derived from the newest review event, falling back to `submitted_at`; it is not a stored column.
- Footprints are exact six-decimal values stored as integer millionths. Uncertainty is stored as integer basis points. Do not use SQLite `REAL` or silently round excess precision.
- API decimal values remain JSON strings.
- Review comments are optional, trimmed, and limited to 500 characters.
- Authentication uses an HTTP-only cookie and stores only a hash of the raw session token.
- Seed data is deterministic and idempotent.

## Editing Practices

- Preserve user changes already present in the worktree. Inspect `git status` before editing and do not overwrite unrelated modifications.
- Follow the style of neighboring files and keep code explicit and easy to explain.
- Update contract documentation when behavior, API shape, persistence, setup, or an approved architectural decision changes.
- Add or update focused tests for behavior changes and regressions. Prefer extending the nearest relevant test over creating redundant test scaffolding.
- Do not add dependencies until existing platform or project capabilities have been checked and found insufficient. Explain any new dependency in the final handoff.
- Do not perform destructive operations such as deleting the database volume, resetting Git changes, or removing files unless the user explicitly asks.

## Verification

Run the narrowest relevant check while iterating, then run the appropriate full suite before handing off a completed change.

Backend:

```bash
cd backend
python -m pytest
ruff check app alembic tests
ruff format --check app alembic tests
```

Frontend:

```bash
cd frontend
npm test
npm run lint
npm run build
```

For cross-stack, configuration, migration, or container changes, also verify the relevant Docker workflow from `README.md`. Never run `docker compose down -v` as routine verification because it deletes local data.

If a check cannot run, report the exact command and reason. Do not claim verification that was not performed.

## Handoff

At the end of a task, briefly state:

- What changed and why.
- Which files contain the important changes.
- Which checks ran and whether they passed.
- Any remaining risk, assumption, or follow-up.

Do not provide a long play-by-play of routine commands.
