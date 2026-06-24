# AGENTS.md

This repository is **Lerna**, a tool for managing JavaScript/TypeScript monorepos. It uses **Nx** as the task runner. See `CLAUDE.md` for detailed contributor conventions (package manager, commit style, project layout, command-specific tests). The standard dev commands live in `CLAUDE.md`, `CONTRIBUTING.md`, and the root `package.json` `scripts` — refer to those rather than duplicating them.

## Cursor Cloud specific instructions

The update script runs `npm ci` on startup, so dependencies are already installed when a session begins.

Lerna has no GUI or long-running server; the "application" is the `lerna` CLI. Core commands (`build`, `lint`, `test`, `integration`, `e2e`) are run through Nx — see `CLAUDE.md` for the exact commands.

### Node version (important, non-obvious)

This repo pins Node `22.19.0` via Volta (`package.json`). The VM's default `node` (`/exec-daemon/node`) is an **older 22.x patch (22.14.0)** whose `util.styleText()` emits ANSI color even for non-TTY / `NO_COLOR` output. That breaks the `--stream` / `--parallel` snapshot assertions in `lerna run` / `lerna exec`, so **4 integration tests fail on the default node** even though `build`, `lint`, and unit tests pass.

Setup already installed `22.19.0` via nvm and appended a `PATH` prepend to `~/.bashrc`, so new shells resolve `node -v` → `22.19.0` automatically and integration tests pass. If a future shell ever reports `22.14.0`, run `nvm use 22.19.0` (or `export PATH="$HOME/.nvm/versions/node/v22.19.0/bin:$PATH"`) before running integration/e2e tests. Do **not** add the node install to the update script; it is captured in the VM snapshot.

### Other non-obvious gotchas discovered during setup

- **`npx lerna` is not available immediately after `npm ci`.** The `lerna` bin points at `packages/lerna/dist/cli.js`, which does not exist until the package is built. To run the CLI:
  - Build first with `npx nx run-many -t build` (or `npm run build`), **then run `npm install` once** to (re)create the `node_modules/.bin/lerna` symlink. After that `npx lerna ...` works.
  - Or, without relinking, invoke the built CLI directly: `node packages/lerna/dist/cli.js <command>`.
- `npm run build` (`tools/scripts/build.sh`) must be run from the repo root; it deletes/recreates the root `dist/` directory and re-runs `npm install` to relink the `lerna` bin.
- E2E tests (`nx e2e <project>`) publish packages to a local Verdaccio registry and require `pnpm` (>= 8.10.2). Only run e2e after build, lint, unit, and integration tests pass (per `CLAUDE.md`).
