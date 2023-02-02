# `lerna run`

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

Run an [npm script](https://docs.npmjs.com/misc/scripts) in each package that contains that script. A double-dash (`--`)
is necessary to pass dashed arguments to the script execution.

> **Note for using yarn:**
>
> ```sh
> $ yarn lerna <script> -- [..args]
> ```
>
> The double dash (`--`) will be stripped by `yarn`. This results in the inability for Lerna to pass additional args to child scripts through the command line alone. To get around this, either globally install Lerna and run it directly, or create a script in `package.json` with your `lerna run` command and use `yarn` to directly run that instead.

## Options

`lerna run` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options).

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

Similar to `--stream`, but completely disregards concurrency and topological sorting, running a given command or script
immediately in all matching packages with prefixed streaming output. This is the preferred flag for long-running
processes such as `npm run watch` run over many packages.

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

### `--profile`

Profiles the script executions and produces a performance profile which can be analyzed using DevTools in a
Chromium-based browser (direct url: `devtools://devtools/bundled/devtools_app.html`). The profile shows a timeline of
the script executions where each execution is assigned to an open slot. The number of slots is determined by the
`--concurrency` option and the number of open slots is determined by `--concurrency` minus the number of ongoing
operations. The end result is a visualization of the parallel execution of your scripts.

The default location of the performance profile output is at the root of your project.

```sh
$ lerna run build --profile
```

> **Note:** Lerna will only profile when topological sorting is enabled (i.e. without `--parallel` and `--no-sort`).

### `--profile-location <location>`

You can provide a custom location for the performance profile output. The path provided will be resolved relative to the
current working directory.

```sh
$ lerna run build --profile --profile-location=logs/profile/
```

### `--load-env-files`

By default the modern task runner powered by Nx will automatically load .env files for you. You can set `--load-env-files` to false if you want to disable this behavior for any reason.

For more details about what `.env` files will be loaded by default please see: https://nx.dev/recipes/environment-variables/define-environment-variables

### `useNx=false`

By setting `useNx` to `false` you can use the legacy task running implementations in `lerna` (`p-map` and `p-queue`) instead of using the default modern task runner implementation powered by [Nx](https://nx.dev).
