# AGENTS.md

This repository is **Lerna**, a tool for managing JavaScript/TypeScript monorepos. It uses **Nx** as the task runner. See `CLAUDE.md` for detailed contributor conventions (package manager, commit style, project layout, command-specific tests). The standard dev commands live in `CLAUDE.md`, `CONTRIBUTING.md`, and the root `package.json` `scripts` — refer to those rather than duplicating them.

## Cursor Cloud specific instructions

The update script runs `npm ci` on startup, so dependencies are already installed when a session begins.

Lerna has no GUI or long-running server; the "application" is the `lerna` CLI. Core commands (`build`, `lint`, `test`, `integration`, `e2e`) are run through Nx — see `CLAUDE.md` for the exact commands.

### Node version (important, non-obvious)

Match the Node version pinned in `package.json` (`volta.node`) — that is the single source of truth, also used by CI. The VM's default `node` (`/exec-daemon/node`) is a slightly older 22.x patch that does not match it, and the mismatch is not cosmetic: that older patch's `util.styleText()` emits ANSI color even for non-TTY / `NO_COLOR` output, which breaks the `--stream` / `--parallel` snapshot assertions in `lerna run` / `lerna exec`. The result is a handful of failing integration tests even though `build`, `lint`, and unit tests pass on either version.

Setup installed the pinned version via nvm and prepended it to `PATH` in `~/.bashrc`, so new shells should already resolve `node -v` to the pinned version. If a shell ever reports a different version, install/select the pinned one before running integration/e2e tests, e.g. `nvm install "$(node -p "require('./package.json').volta.node")" && nvm use "$(node -p "require('./package.json').volta.node")"`. Do **not** add the node install to the update script; it is captured in the VM snapshot.

### Other non-obvious gotchas discovered during setup

- **`npx lerna` is not available immediately after `npm ci`.** The `lerna` bin points at `packages/lerna/dist/cli.js`, which does not exist until the package is built. To run the CLI:
  - Build first with `npx nx run-many -t build` (or `npm run build`), **then run `npm install` once** to (re)create the `node_modules/.bin/lerna` symlink. After that `npx lerna ...` works.
  - Or, without relinking, invoke the built CLI directly: `node packages/lerna/dist/cli.js <command>`.
- `npm run build` (`tools/scripts/build.sh`) must be run from the repo root; it deletes/recreates the root `dist/` directory and re-runs `npm install` to relink the `lerna` bin.
- E2E tests (`nx e2e <project>`) publish packages to a local Verdaccio registry and require `pnpm` (>= 8.10.2) for the full suite (the `e2e-repair` project itself runs on npm). Only run e2e after build, lint, unit, and integration tests pass (per `CLAUDE.md`). See `CONTRIBUTING.md` for the full e2e flow.
- **`e2e-repair` snapshot drifts when Nx publishes new `repair` migrations.** The `e2e/repair/src/repair.spec.ts` inline snapshot lists every Nx migration, so any newly released Nx migration (e.g. a new `.gitignore` entry) makes it fail in CI even on unrelated branches. This is expected pre-existing drift, not a regression — refresh it with `npx nx e2e e2e-repair -u` (per `CONTRIBUTING.md`) and commit the updated snapshot.
