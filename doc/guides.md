# Guides

## Jest / Visual Studio Code Debugging

It is possible to debug [Jest](https://facebook.github.io/jest/) tests in a Lerna-managed package using [Visual Studio Code](https://code.visualstudio.com/). Debugging with breakpoints works with the vscode launch configuration below in the monorepo's `<root>/.vscode/launch.json` file. This example launches Jest for a single package `my-package` located in the monorepo.

```javascript
{
    "name": "Jest my-package",
    "type": "node",
    "request": "launch",
    "address": "localhost",
    "protocol": "inspector",
    "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/lerna",
    "runtimeArgs": [
        "exec",
        "--scope",
        "my-package",
        "--",
        "node"
    ],
    "args": [
        "${workspaceRoot}/node_modules/jest/bin/jest.js",
        "--runInBand",
        "--no-cache",
        "packages/my-package"
    ]
}
```

* [`--runInBand`](https://facebook.github.io/jest/docs/en/cli.html#runinband) avoids parallelizing tests across multiple processes
* [`--no-cache`](https://facebook.github.io/jest/docs/en/cli.html#cache) helps avoid caching issues

Tested with Visual Studio Code v1.19.3 and Jest v22.1.4.
