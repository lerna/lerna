# Using Bun with Lerna

Lerna can be used in a [Bun workspace](https://bun.sh/docs/install/workspaces) to get the full benefits of both [Bun's](https://bun.sh) native performance and Lerna's monorepo management capabilities.

When used with Bun, Lerna will:

- use `bun install` for dependency management
- execute scripts with `bun run`
- update `bun.lockb` during version bumps
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

5. Run `bun install` to generate a `bun.lockb` file.

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
    "lerna": "^8.0.0"
  }
}
```

## Benefits

- **Speed**: Bun's native performance significantly speeds up installs and script execution
- **Compatibility**: Works with existing npm packages and standard npm scripts
- **Simplicity**: Uses standard `package.json` workspaces - no additional configuration files needed
- **Modern**: Built with modern JavaScript runtimes in mind

## Considerations

### Binary Lockfile

Bun uses a binary lockfile format (`bun.lockb`) which is not human-readable like other package managers' lockfiles. This means:

- You cannot manually edit the lockfile
- Merge conflicts in the lockfile require careful resolution (though Bun handles most cases automatically)
- Debugging lockfile issues requires using Bun's CLI tools

### Command Compatibility

Most Lerna commands work seamlessly with Bun:

- ✅ `lerna init` - Auto-detects Bun and configures accordingly
- ✅ `lerna run` - Executes scripts using `bun run`
- ✅ `lerna version` - Updates `bun.lockb` automatically
- ✅ `lerna publish` - Full publishing workflow support
- ✅ `lerna changed` - Detects changed packages correctly
- ✅ `lerna exec` - Runs commands across packages

Note: `bootstrap`, `link`, and `add` commands work but consider using `bun add` directly for better performance and workspace protocol support.

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

If `bun.lockb` isn't being updated during `lerna version`, ensure:

1. The lockfile exists in the root directory
2. `"npmClient": "bun"` is set in `lerna.json`
3. You have write permissions to the root directory

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
- [Lerna Configuration](https://lerna.js.org/docs/api-reference/lerna-json)
