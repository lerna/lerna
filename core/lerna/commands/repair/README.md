# `lerna repair`

> Update configuration files to match the currently installed version of lerna

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna repair
```

### Upgrading

`lerna repair` is most useful after an upgrade to ensure that any configuration file changes for the new version of `lerna` are applied.

```sh
$ npm i lerna@latest
$ lerna repair
```
