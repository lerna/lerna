# `lerna exec`

> Execute an arbitrary command in each package

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna exec -- <command> [..args] # runs the command in all packages
$ lerna exec -- rm -rf ./node_modules
$ lerna exec -- protractor conf.js
```

Run an arbitrary command in each package.
A double-dash (`--`) is necessary to pass dashed flags to the spawned command, but is not necessary when all the arguments are positional.

The name of the current package is available through the environment variable `LERNA_PACKAGE_NAME`:

```sh
$ lerna exec -- npm view \$LERNA_PACKAGE_NAME
```

You may also run a script located in the root dir, in a complicated dir structure through the environment variable `LERNA_ROOT_PATH`:

```sh
$ lerna exec -- node \$LERNA_ROOT_PATH/scripts/some-script.js
```

## Options

`lerna exec` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options).

```sh
$ lerna exec --scope my-component -- ls -la
```

> The commands are spawned in parallel, using the concurrency given (except with `--parallel`).
> The output is piped through, so not deterministic.
> If you want to run the command in one package after another, use it like this:

```sh
$ lerna exec --concurrency 1 -- ls -la
```

### `--stream`

Stream output from child processes immediately, prefixed with the originating
package name. This allows output from different packages to be interleaved.

```sh
$ lerna exec --stream -- babel src -d lib
```

### `--parallel`

Similar to `--stream`, but completely disregards concurrency and topological sorting, running a given command or script immediately in all matching packages with prefixed streaming output. This is the preferred flag for long-running processes such as `babel src -d lib -w` run over many packages.

```sh
$ lerna exec --parallel -- babel src -d lib -w
```

> **Note:** It is advised to constrain the scope of this command when using
> the `--parallel` flag, as spawning dozens of subprocesses may be
> harmful to your shell's equanimity (or maximum file descriptor limit,
> for example). YMMV

### `--no-bail`

```sh
# Run a command, ignoring non-zero (error) exit codes
$ lerna exec --no-bail <command>
```

By default, `lerna exec` will exit with an error if _any_ execution returns a non-zero exit code.
Pass `--no-bail` to disable this behavior, executing in _all_ packages regardless of exit code.

### `--no-prefix`

Disable package name prefixing when output is streaming (`--stream` _or_ `--parallel`).
This option can be useful when piping results to other processes, such as editor plugins.

### `--profile`

Profiles the command executions and produces a performance profile which can be analyzed using DevTools in a
Chromium-based browser (direct url: `devtools://devtools/bundled/devtools_app.html`). The profile shows a timeline of
the command executions where each execution is assigned to an open slot. The number of slots is determined by the
`--concurrency` option and the number of open slots is determined by `--concurrency` minus the number of ongoing
operations. The end result is a visualization of the parallel execution of your commands.

The default location of the performance profile output is at the root of your project.

```sh
$ lerna exec --profile -- <command>
```

> **Note:** Lerna will only profile when topological sorting is enabled (i.e. without `--parallel` and `--no-sort`).

### `--profile-location <location>`

You can provide a custom location for the performance profile output. The path provided will be resolved relative to the current working directory.

```sh
$ lerna exec --profile --profile-location=logs/profile/ -- <command>
```
