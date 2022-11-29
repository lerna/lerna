# Lerna 6: Obsolete Options

Nx and Lerna work together seamlessly in the same workspace.

When Lerna is running tasks with Nx and detects Nx target configuration, Lerna will respect this configuration during `lerna run`
and delegate dependency detection to the Nx task runner.

Nx will run tasks in an order and with a concurrency that it determines appropriate based on the task graph that it
creates. For more information,
see [Nx Mental Model: The Task Graph](https://nx.dev/concepts/mental-model#the-task-graph).

**This behavior allows Nx to run tasks in the most efficient way possible, but it also means that some existing options
for `lerna run` become obsolete.
**

## Obsolete Options

### `--sort` and `--no-sort`

When Nx targets are configured, Lerna will always run tasks in the order it deems is correct based on its knowledge of
project and task dependencies, so `--sort` and `--no-sort` have no effect.

### `--parallel`

Lerna will use the task graph to determine which tasks can be run in parallel and do so automatically, so `--parallel`
has no effect.

:::note
If you want to limit the concurrency of tasks, you can still use
the [concurrency global option](https://github.com/lerna/lerna/blob/6cb8ab2d4af7ce25c812e8fb05cd04650105705f/core/global-options/README.md#--concurrency)
to accomplish this.
:::

### `--include-dependencies`

Lerna 6 will automatically run dependent tasks first when necessary, so `--include-dependencies` is obsolete. However,
the flag can still be used to include tasks that are not required (e.g., running the tests of all the dependent
projects).

### `--ignore`

When used with Nx, `--ignore` will never cause `lerna run` to exclude any tasks that are deemed to be
required [task graph](https://nx.dev/concepts/mental-model#the-task-graph).

:::tip

The effects on the options above will only apply if:

1.  `nx.json` exists in the root with the `targetDefaults` property
    defined.
2.  The `"nx"` property is found in the package.json of a target package.

Otherwise, they will behave just as they would with Lerna's legacy task runner (if `useNx` is `false`).

:::
