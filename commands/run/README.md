# `@lerna/run`

> Run an npm script in each package that contains that script

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna run <script> -- [..args] # runs npm run my-script in all packages that have it
$ lerna run test
$ lerna run build

# watch all packages and transpile on change, streaming prefixed output
$ lerna run --parallel watch
```

Run an [npm script](https://docs.npmjs.com/misc/scripts) in each package that contains that script. A double-dash (`--`) is necessary to pass dashed arguments to the script execution.

## Options

`lerna run` respects the `--concurrency`, `--scope`, and `--ignore` flags (see [Filter Flags](https://www.npmjs.com/package/@lerna/filter-options)).

```sh
$ lerna run --scope my-component test
```

### `--npm-client <client>`

Must be an executable that knows how to run npm lifecycle scripts.
The default `--npm-client` is `npm`.

```sh
$ lerna run build --npm-client=yarn
```

May also be configured in `lerna.json`:

```json
{
  "command": {
    "run": {
      "npmClient": "yarn"
    }
  }
}
```

### `--stream`

Stream output from child processes immediately, prefixed with the originating
package name. This allows output from different packages to be interleaved.

```sh
$ lerna run watch --stream
```

### `--parallel`

Similar to `--stream`, but completely disregards concurrency and topological sorting, running a given command or script immediately in all matching packages with prefixed streaming output. This is the preferred flag for long-running processes such as `npm run watch` run over many packages.

```sh
$ lerna run watch --parallel
```

> **Note:** It is advised to constrain the scope of this command when using
> the `--parallel` flag, as spawning dozens of subprocesses may be
> harmful to your shell's equanimity (or maximum file descriptor limit,
> for example). YMMV

### `--no-bail`

```sh
# Run an npm script in all packages that contain it, ignoring non-zero (error) exit codes
$ lerna run --no-bail test
```

By default, `lerna run` will exit with an error if _any_ script run returns a non-zero exit code.
Pass `--no-bail` to disable this behavior, running the script in _all_ packages that contain it regardless of exit code.

### `--no-prefix`

Disable package name prefixing when output is streaming (`--stream` _or_ `--parallel`).
This option can be useful when piping results to other processes, such as editor plugins.
