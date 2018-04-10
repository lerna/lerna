# `@lerna/map-to-registry`

> Produce registry uri and auth of package name from npm config

## Usage

This is an extraction of an internal npm [utility](https://github.com/npm/npm/blob/f644018/lib/utils/map-to-registry.js). Caveat emptor.

```js
'use strict';

const mapToRegistry = require('@lerna/map-to-registry');
const npmConf = require('@lerna/npm-conf');

const config = npmConf();
const { uri, auth } = mapToRegistry("my-package", config);
```

`uri` and `auth` are suitable for arguments to [npm-registry-client](https://www.npmjs.com/package/npm-registry-client) instance method parameters.
