# Using Bun with Lerna

Lerna can be used in a [Bun workspace](https://bun.sh/docs/install/workspaces) to get the full benefits of both [Bun's](https://bun.sh) native performance and Lerna's monorepo management capabilities.

When used with Bun, Lerna will:

- execute scripts with `bun run`
- regenerate the bun lockfile (via `bun install --lockfile-only`) during `lerna version` bumps
- resolve packages using `package.json` workspaces (same as npm/yarn)
- respect the [workspace protocol](https://bun.sh/docs/install/workspaces#workspace-dependencies) for package dependencies

## Getting Started

To set up Bun with Lerna:

1. If not installed already, install Bun: https://bun.sh/docs/installation
2. Remove the `node_modules/` folder in the root, if it exists. Remove any existing lockfiles (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`).
3. Set `"npmClient": "bun"` in `lerna.json`.
4. Ensure `package.json` has a `workspaces` property configured:

   ```json title="package.json"
   {
     "name": "my-monorepo",
     "private": true,
     "workspaces": ["packages/*"]
   }
   ```

5. Run `bun install` to generate a `bun.lock` file.

## Example Configuration

### lerna.json

```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "1.0.0",
  "npmClient": "bun"
}
```

### package.json

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["packages/*"],
  "devDependencies": {
    "lerna": "^9.0.0"
  }
}
```

## Benefits

- **Speed**: Bun's native performance significantly speeds up installs and script execution
- **Compatibility**: Works with existing npm packages and standard npm scripts
- **Simplicity**: Uses standard `package.json` workspaces - no additional configuration files needed
- **Modern**: Built with modern JavaScript runtimes in mind

## Considerations

### Lockfile Formats

Bun v1.2+ uses a text-based `bun.lock` lockfile by default. Older versions of Bun use a binary `bun.lockb` format instead. Lerna supports both formats.

If you are still using the legacy binary `bun.lockb` format, keep in mind:

- You cannot manually edit the lockfile
- Resolving merge conflicts requires regenerating the lockfile (or configuring a [git merge driver](https://bun.sh/docs/install/lockfile))
- Debugging lockfile issues requires using Bun's CLI tools

The text-based `bun.lock` format has none of these limitations, so consider [migrating to it](https://bun.sh/docs/install/lockfile).

### Lockfile Updates During Versioning

When you run `lerna version`, Lerna regenerates the root lockfile by running `bun install --lockfile-only` so that it picks up the bumped package versions. Because the lockfile is regenerated from scratch by your installed version of Bun, running `lerna version` with Bun v1.2+ on a repo that only has a legacy `bun.lockb` will migrate it to the text-based `bun.lock` format. Lerna stages both the removal and the regenerated lockfile in the version commit, so the migration is captured cleanly - but if you want to stay on the binary format, commit the migration consciously or update Bun's [lockfile settings](https://bun.sh/docs/install/lockfile) first.

### Lockfile Detection

When `lerna init` auto-detects the package manager, bun lockfiles (`bun.lock`/`bun.lockb`) take priority over other package managers' lockfiles. If your project has multiple lockfiles, remove the ones you don't need to avoid unexpected detection results.

### Command Compatibility

Most Lerna commands work seamlessly with Bun:

- ✅ `lerna init` - Auto-detects Bun and configures accordingly
- ✅ `lerna run` - Executes scripts using `bun run`
- ✅ `lerna version` - Regenerates the bun lockfile automatically
- ✅ `lerna publish` - Full publishing workflow support
- ✅ `lerna changed` - Detects changed packages correctly
- ✅ `lerna exec` - Runs commands across packages

Note: Lerna's legacy dependency management commands (`bootstrap`, `add`, and `link`) were removed in Lerna v7. Use `bun install` and `bun add` directly instead.

## Migration from Other Package Managers

### From npm/yarn

```bash
# 1. Install Bun
curl -fsSL https://bun.sh/install | bash

# 2. Update lerna.json
# Set "npmClient": "bun"

# 3. Remove old lockfile
rm package-lock.json  # or yarn.lock

# 4. Install with Bun
bun install

# 5. Verify
bunx lerna list
```

### From pnpm

```bash
# 1. Install Bun
curl -fsSL https://bun.sh/install | bash

# 2. Move workspace config from pnpm-workspace.yaml to package.json
# pnpm-workspace.yaml:
#   packages:
#     - "packages/*"
#
# becomes package.json:
#   "workspaces": ["packages/*"]

# 3. Update lerna.json
# Set "npmClient": "bun"

# 4. Remove pnpm files
rm pnpm-lock.yaml pnpm-workspace.yaml

# 5. Install with Bun
bun install

# 6. Verify
bunx lerna list
```

## Troubleshooting

### Lockfile Not Updating

If the bun lockfile isn't being updated during `lerna version`, ensure:

1. The lockfile (`bun.lock` or `bun.lockb`) exists in the root directory - if none exists, Lerna skips the lockfile update
2. `"npmClient": "bun"` is set in `lerna.json`
3. Bun is installed and available on your `PATH`
4. You have write permissions to the root directory

### Slow First Install

Bun's first install may download and cache packages. Subsequent installs will be significantly faster thanks to Bun's global cache.

### Scripts Not Running

If lifecycle scripts aren't executing, check:

1. Scripts are defined in `package.json` of the relevant packages
2. You're using `lerna run <script>` (not `lerna exec bun run <script>`)
3. The script name matches exactly (case-sensitive)

## Further Reading

- [Bun Documentation](https://bun.sh/docs)
- [Bun Workspaces](https://bun.sh/docs/install/workspaces)
- [Lerna Configuration](/docs/api-reference/configuration)
