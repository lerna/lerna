# `lerna add-caching`

> Runs a wizard that sets up basic caching options.

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna add-caching
```

## Questions

Each question the wizard asks will inform how the `nx.json` file is updated.

### Which scripts need to be run in order?

Each script selected will be marked to run dependency scripts of the same name before running the script itself.

If you mark `build` as needing topological order, the `nx.json` file will look like this:

```jsonc
{
  "targetDefaults": {
    "build": {
      "dependsOn": [
        "^build" // build all dependencies before building this project
      ]
    }
  }
}
```

### Which scripts are cacheable?

Each script selected will be cached by Lerna. Only select scripts that do not depend on any external inputs (like network calls). `build` and `test` are usually cacheable. `start` and `serve` are usually not cacheable. Sometimes `e2e` is cacheable.

If you mark `build` as cacheable, the `nx.json` file will look like this:

```jsonc
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": [
          "build" // cache the build script
        ]
      }
    }
  }
}
```

### Does the "[script_name]" script create any outputs?

For each script selected as cacheable, the wizard will ask for an output path. For builds this would be the build output. For tests this would be any coverage reports. The output path is relative to the project root.

If you specify `dist` as the output path for the `build` script, the `nx.json` file will look like this:

```jsonc
{
  "targetDefaults": {
    "build": {
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

## More information

For more details on how to fine tune your caching set up, read about [Task Pipeline Configuration](https://lerna.js.org/docs/concepts/task-pipeline-configuration) and [How Caching Works](https://lerna.js.org/docs/concepts/how-caching-works)
