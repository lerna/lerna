# `@lerna/listable`

> Shared logic for listing package information

This is an internal package for [Lerna](https://github.com/lerna/lerna/#readme), YMMV.

## Usage

### `listable.format()`

```js
const listable = require("@lerna/listable");

const { text, count } = listable.format(packages, options);
```

### `listable.options()`

```js
const listable = require("@lerna/listable");

exports.builder = yargs => {
  listable.options(yargs);
};
```

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.
