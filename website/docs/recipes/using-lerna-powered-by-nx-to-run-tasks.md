# Using Lerna (Powered by Nx) to Run Tasks

Nx and Lerna work together seamlessly in the same workspace.

When `nx.json` is detected in the current workspace and `useNx` is set to `true` in `lerna.json`, Lerna will respect `nx.json` configuration during `lerna run` and delegate to the Nx task runner.

Nx will run tasks in an order and with a concurrency that it determines appropriate based on the task graph that it creates. For more information, see [Nx Mental Model: The Task Graph](https://nx.dev/concepts/mental-model#the-task-graph).

**This behavior allows Nx to run tasks in the most efficient way possible, but it also means that some existing options for `lerna run` become obsolete.
**

## Obsolete Options

### `--sort` and `--no-sort`

Nx will always run tasks in the order it deems is correct based on its knowledge of project and task dependencies, so `--sort` and `--no-sort` have no effect.

### `--parallel`

Nx will use the task graph to determine which tasks can be run in parallel and do so automatically, so `--parallel` has no effect.

:::note
If you want to limit the concurrency of tasks, you can still use the [concurrency global option](https://github.com/lerna/lerna/blob/6cb8ab2d4af7ce25c812e8fb05cd04650105705f/core/global-options/README.md#--concurrency) to accomplish this.
:::

### `--include-dependencies`

Lerna by itself does not have knowledge of which tasks depend on others, so it defaults to excluding tasks on dependent projects when using [filter options](https://github.com/lerna/lerna/tree/6cb8ab2d4af7ce25c812e8fb05cd04650105705f/core/filter-options#lernafilter-options) and relies on `--include-dependencies` to manually specify that dependent projects' tasks should be included.

This is no longer a problem when Lerna uses Nx to run tasks. Nx, utilizing its [task graph](https://nx.dev/concepts/mental-model#the-task-graph), will automatically run dependent tasks first when necessary, so `--include-dependencies` is obsolete. However, it can still be used to include project dependencies that Lerna detects but Nx does not deem necessary and would otherwise exclude.

### `--ignore`

When used with Nx, `--ignore` will never cause `lerna run` to exclude any tasks that are deemed to be required by the Nx [task graph](https://nx.dev/concepts/mental-model#the-task-graph).

:::tip

The effects on the options above will only apply if `nx.json` exists in the root with the `targetDefaults` property defined. Otherwise, they will behave just as they would with Lerna's base task runner (if `useNx` is `false`).

:::
