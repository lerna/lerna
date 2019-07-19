"use strict";

const fs = require("fs");
const path = require("path");

const aBuildTool = path.resolve(__dirname, "a-build-tool.js");

fs.writeFileSync(aBuildTool, "#!/usr/bin/env node\n\nconsole.log('build tool executed');");
fs.chmodSync(aBuildTool, 0o755);
