# Guides

## Jest / Visual Studio Code Debugging
It is possible to debug [Jest](https://facebook.github.io/jest/) tests in a Lerna manage package using [Visual Studio Code](https://code.visualstudio.com/). Debugging with breakpoints works with the vscode launch configuration below in the monorepo's <root>/.vscode/launch.json file. It launches Jest for a single package, my-package, managed in the monorepo.

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
        "--runInBand", // https://facebook.github.io/jest/docs/en/cli.html#runinband - don't parallelize
        "--no-cache", // https://facebook.github.io/jest/docs/en/cli.html#cache - just avoid caching issues
        "path/to/my-package" // from monorepo root
    ]
}
```
Tested with Vsiaul Studio Code version 1.19.3 and Jest version 22.1.4.