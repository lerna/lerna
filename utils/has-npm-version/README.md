# `@lerna/has-npm-version`

> Test if the current version of npm satisfies a given semver range

## Usage

```js
const hasNpmVersion = require("@lerna/has-npm-version");

// `npm --version` === 6.3.0
hasNpmVersion(">=6"); // => true

// `npm --version` === 5.6.0
hasNpmVersion(">=6"); // => false

// makePredicate() caches the call to `npm --version`
// useful if you're calling it repeatedly in a loop
const predicate = hasNpmVersion.makePredicate();

// `npm --version` === 6.3.0
hasNpmVersion(">=5"); // => true
```

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.
