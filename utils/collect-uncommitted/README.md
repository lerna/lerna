# `@lerna/collect-uncommitted`

> Check git working tree status and collect uncommitted changes for display

## Usage

```js
const collectUncommitted = require("@lerna/collect-uncommitted");

// values listed here are their defaults
const options = {
  cwd: process.cwd(),
  log: require("npmlog"),
};

(async () => {
  try {
    const results = await collectUncommitted(options);
    console.log(`Uncommitted changes on CWD ${options.cwd}: ${results.join("\n")}`);
  } catch (err) {
    console.error(err.message);
  }
})();
```

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.
