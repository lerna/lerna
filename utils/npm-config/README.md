# `@lerna/npm-config`

> A convenient wrapper around [`@npmcli/config`](https://github.com/npm/config#readme)

## Usage

See [`@npmcli/config`](https://github.com/npm/config#readme) for detailed documentation.

This module merely wraps that implementation with "good enough" defaults and types, as well as providing a [`flatOptions`](https://github.com/npm/cli/blob/latest/lib/utils/flat-options.js) getter that translates `dash-cased` config keys to `camelCase` option keys.

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.
