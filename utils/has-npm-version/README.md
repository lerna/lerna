# `@lerna/has-npm-version`

> Test if the current version of npm satisfies a given semver range

## Usage

```js
const { hasNpmVersion } = require("@lerna/has-npm-version");

// `npm --version` === 6.3.0
hasNpmVersion(">=6"); // => true

// `npm --version` === 5.6.0
hasNpmVersion(">=6"); // => false

// `npm --version` === 6.3.0
hasNpmVersion(">=5"); // => true
```

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.
