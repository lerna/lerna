#!/usr/bin/env node
"use strict";
const resolveCwd = require("resolve-cwd");
const CLI = resolveCwd.silent("lerna/lib/cli") || "../lib/cli";

require(CLI)().parse(process.argv.slice(2));
