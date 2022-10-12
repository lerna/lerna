# `@lerna/global-options`

> Global options applicable to _every_ lerna sub-command

## Options

### `--concurrency`

How many threads to use when Lerna parallelizes the tasks (defaults to count of logical CPU cores)

```sh
$ lerna publish --concurrency 1
```

### `--loglevel <silent|error|warn|success|info|verbose|silly>`

What level of logs to report. On failure, all logs are written to lerna-debug.log in the current working directory.

Any logs of a higher level than the setting are shown. The default is "info".

### `--max-buffer <bytes>`

Set a max buffer length for each underlying process call. Useful for example
when someone wants to import a repo with a larger amount of commits while
running `lerna import`. In that case the built-in buffer length might not
be sufficient.

### `--no-progress`

Disable progress bars. This is always the case in a CI environment.

### `--no-sort`

Note: As of Lerna 6 this property is ignored when `nx.json` is present.

By default, all tasks execute on packages in topologically sorted order as to respect the dependency relationships of the packages in question. Cycles are broken on a best-effort basis in a way not guaranteed to be consistent across Lerna invocations.

Topological sorting can cause concurrency bottlenecks if there are a small number of packages with many dependents or if some packages take a disproportionately long time to execute. The `--no-sort` option disables sorting, instead executing tasks in an arbitrary order with maximum concurrency.

This option can also help if you run multiple "watch" commands. Since `lerna run` will execute commands in topologically sorted order, it can end up waiting for a command before moving on. This will block execution when you run "watch" commands, since they typically never end. An example of a "watch" command is [running `babel` with the `--watch` CLI flag](https://babeljs.io/docs/usage/cli/#babel-compile-files).

### `--reject-cycles`

Fail immediately if a cycle is found (in `bootstrap`, `exec`, `publish` or `run`).

```sh
$ lerna bootstrap --reject-cycles
```
