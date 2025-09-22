# Guidelines for Claude Code

This repository is **Lerna**, a popular tool for managing JavaScript projects with multiple packages. Lerna uses Nx as the task runner and monorepo manager for building, testing, and managing the various Lerna commands and core functionality.

## Package Manager

This project uses **npm** (version 10.8.0) as the package manager. Always use `npm` commands instead of `pnpm` or `yarn`.

## Required checks

When modifying core Lerna functionality, commands, or documentation, run the following commands and ensure they pass:

```bash
npm run format:check # run npm run format:write and commit the result if this check fails
npm run lint # run linting across all packages
npm run test # run all unit tests
npm run integration # run integration tests
```

When working on a specific Lerna command, you can target tests for that command. For example, to run tests for the `publish` command:

```bash
nx test commands-publish
```

For E2E tests of specific commands:

```bash
nx e2e publish # test the publish command end-to-end
```

Use these commands for comprehensive testing:

- `nx run-many -t build` to build all packages
- `nx run-many -t test` to run all unit tests across all packages
- `nx run-many -t lint` to run all linting across all packages

IMPORTANT: Only run e2e commands once all other types of tests (and linting and building) have passed successfully.

## Project Structure

This is a monorepo with the following main structure:

### `/libs/` - Core Libraries

- **commands/**: Individual Lerna command implementations (add, bootstrap, changed, clean, create, diff, exec, import, info, init, link, list, publish, run, version)
- **core/**: Core Lerna functionality and shared utilities
- **legacy-core/**: Legacy core functionality maintained for backwards compatibility
- **child-process/**: Utilities for spawning and managing child processes
- **e2e-utils/**: Utilities for end-to-end testing
- **test-helpers/**: Shared testing utilities and mocks
- **nx-plugin/**: Nx plugin for the Lerna monorepo (not published)

### `/packages/` - Published Packages

- **lerna/**: Main Lerna package that gets published to npm
- **legacy-structure/**: Legacy structure maintained for compatibility

### `/e2e/` - End-to-End Tests

- Individual test suites for each Lerna command (changed, clean, create, diff, exec, info, init, list, publish, repair, run, version, watch)

### `/__fixtures__/` - Test Fixtures

- Various test scenarios and sample monorepo structures for integration testing

## Code Conventions

### TypeScript Configuration

- **Strict TypeScript**: Uses strict mode with modern ES2022 target
- **Target**: ES2022 with Node.js module resolution
- **Module system**: Modern Node.js compatibility
- **Node.js version**: 22.19.0 (managed by Volta)

### ESLint Configuration

- Uses **flat config** format (eslint.config.mjs)
- Nx ESLint plugin for monorepo management
- TypeScript ESLint for type-aware linting
- Enforces module boundaries between packages

### File Naming and Structure

- **Test files**: Use `.spec.ts` suffix and live in `__tests__/` or `src/__tests__/` directories
- **Command files**: Individual TypeScript files in `libs/commands/{command-name}/src/`
- **Core utilities**: In `libs/core/src/` and related core packages
- **E2E tests**: Organized in `e2e/{command-name}/src/` directories
- **Fixtures**: Test scenarios in `__fixtures__/` directories

### Command Development Patterns

When creating or modifying Lerna commands:

1. Commands are implemented in TypeScript in `libs/commands/{command-name}/`
2. Each command has its own library with tests and documentation
3. Commands use shared utilities from `libs/core/` and other core packages
4. E2E tests verify command behavior in realistic scenarios
5. Commands follow consistent patterns for CLI argument parsing and execution

### Testing Conventions

- **Jest**: Primary testing framework with Nx test runner
- **Unit tests**: Test individual functions and command logic
- **Integration tests**: Test command interactions and workflows
- **E2E tests**: Test full command execution in realistic monorepo scenarios
- **Fixtures**: Predefined test scenarios for consistent testing

### Build and Release

- **Build**: Uses Nx with TypeScript compilation and esbuild
- **Targets**: Multiple build targets with dependency management
- **Release**: Conventional Commits with automated versioning
- **Versioning**: Uses Lerna's own versioning system
- **Publishing**: Commands handle npm package publishing

Claude should NEVER run versioning or publishing commands.

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and PR titles.

- When a change affects a single command, include its name as the scope: `feat(publish): add registry authentication`.
- When multiple commands are affected, omit the scope: `fix: correct workspace detection`.
- When affecting core functionality: `feat(core): add new package discovery method`.

By convention, if only updating a single command within the commands library, for example the `version` command, the commit message should be `fix(version): description of the change`.

For any changes that only update tests, use `test` or `chore` as the commit/PR type, do not use `fix` or `feat`.

## Development Tools

- **Node.js**: Version 20.18.3 (managed by Volta, check `package.json` for current version)
- **npm**: Version 10.8.0 as the package manager
- **Nx**: Task runner and monorepo management
- **TypeScript**: Strict configuration for type safety
- **Jest**: Testing framework with Nx integration

## Common Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build
# or use Nx directly
nx run-many -t build

# Run all tests
npm run test
# or use Nx directly
nx run-many -t test

# Run integration tests
npm run integration

# Run E2E tests for a specific command
nx e2e publish

# Format code
npm run format:write

# Check formatting
npm run format:check

# Lint all packages
npm run lint
# or use Nx directly
nx run-many -t lint

# Test a specific command
nx test commands-publish

# Build and test everything
nx run-many -t build test lint

# Start local registry for E2E testing
npm run e2e-start-local-registry

# Build package for E2E publishing tests
npm run e2e-build-package-publish
```

## Lerna Configuration

The project includes a `lerna.json` configuration file that defines:

- Command-specific settings (create, publish, version)
- Conventional commits for versioning
- GitHub releases integration
- Files to ignore when detecting changes

This configuration is used both for Lerna's own development and as a reference implementation for users.
