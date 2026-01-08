# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the SolidJS grid source. Key entry point is `src/index.tsx`, with core logic in `src/gridsheet.tsx` and utilities in `src/utils.ts`.
- `src/plugins/` houses built-in plugin modules and helpers.
- `docs/` holds usage guides (`docs/guide.md`, `docs/recipes.md`, `docs/styling.md`).
- `examples/` provides runnable or reference usage snippets.
- `dist/` is build output (published package files).

## Build, Test, and Development Commands
- `bun install`: install dependencies.
- `bun run build`: builds `dist/` using `tsdown` with SolidJS compilation.
- `bun run lint`: runs Biome lint with auto-fixes.
- `bun run fmt`: formats the codebase with Biome.
- `bun x tsc -p tsconfig.json --noEmit`: runs a type-only check without emitting files.
- `bun run prepare`: installs git hooks via Lefthook (runs automatically on install).

## Testing Guidelines
- No automated test suite is defined yet. If adding tests, place them under a new `tests/` directory or alongside modules as `*.test.ts(x)`, and document the runner in `package.json`.
- Run focused checks with `bun run lint` and `bun x tsc -p tsconfig.json --noEmit` before opening a PR.

## Commit & Pull Request Guidelines
- Commit history mixes short imperative messages with conventional prefixes (`chore:`, `fix`, `feat`). Use concise, descriptive summaries.
- Create PRs with the GitHub CLI (`gh pr create`).
- PR body guidance:
  - CodeRabbit will append diff-based details; focus the body on intent, goals, and context not obvious from the diff.
  - Link issues when applicable.

## Security & Configuration Tips
- This package targets SolidJS as a peer dependency; avoid bundling SolidJS in build output.
- Keep `dist/` generated via `bun run build` and avoid manual edits.
