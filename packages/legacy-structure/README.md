# Legacy Package Structure

This directory and the packages contained within it are maintained for backwards compatibility with the legacy package structure.

**DO NOT UPDATE FILES IN THIS DIRECTORY**

The packages are simply reexporting from other places in the codebase and should be the subject of direct updates, including README.md files, which are copied from other relevant locations as part of the build process.

## Why does this exist?

Historically, `lerna` was split into a very large number of tiny packages. This added bloat to the install size and increased the maintenance burden for contributors.

These tiny packages are now marked as deprecated on `npm` and from version `7.0.0` onwards, they will no longer receive updates.

Instead all updates will be made to the `lerna` package itself, and potentially a few other useful standalone utilities packages.
