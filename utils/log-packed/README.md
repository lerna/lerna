# `@lerna/log-packed`

> Log the result of npm pack --json

Extracted from the [npm source](https://github.com/npm/cli/blob/4f801d8a476f7ca52b0f182bf4e17a80db12b4e2/lib/pack.js#L175-L212).

## Usage

```js
const execa = require("execa");
const { logPacked } = require("@lerna/log-packed");

execa("npm", ["pack", "--json"]).then(result => {
  const tarballs = JSON.parse(result.stdout);
  tarballs.forEach(logPacked);
});
```

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.
