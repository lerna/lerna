# `@lerna/project`

> Lerna project configuration

## Configuration Resolution

Lerna's file-based configuration is located in `lerna.json` or the `lerna` property of `package.json`.
Wherever this configuration is found is considered the "root" of the lerna-managed multi-package repository.
A minimum-viable configuration only needs a `version` property; the following examples are equivalent:

```json
{
  "version": "1.2.3"
}
```

```json
{
  "name": "my-monorepo",
  "version": "0.0.0-root",
  "private": true,
  "lerna": {
    "version": "1.2.3"
  }
}
```

Any other properties on this configuration object will be used as defaults for CLI options of _all_ lerna subcommands. That is to say, CLI options _always_ override values found in configuration files (a standard practice for CLI applications).

### Command-Specific Configuration

To focus configuration on a particular subcommand, use the `command` subtree. Each subproperty of `command` corresponds to a lerna subcommand (`publish`, `create`, `run`, `exec`, etc).

```json
{
  "version": "1.2.3",
  "command": {
    "publish": {
      "loglevel": "verbose"
    }
  },
  "loglevel": "success"
}
```

In the example above, `lerna publish` will act as if `--loglevel verbose` was passed.
All other subcommands will receive the equivalent of `--loglevel success` (much much quieter).
