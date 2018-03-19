"use strict";

// Overwrite npm userconfig to avoid test pollution
// https://docs.npmjs.com/misc/config#npmrc-files
process.env.npm_config_userconfig = require("path").resolve(__dirname, "test-user.ini");
