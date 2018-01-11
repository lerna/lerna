#!/usr/bin/env node

"use strict"; // eslint-disable-line strict, lines-around-directive

require("../lib/cli")().parse(process.argv.slice(2));
