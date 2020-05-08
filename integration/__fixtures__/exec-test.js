/**
 * Prints out the package name and any passed args, followed by
 * all the files in this directory
 * eg
 * package-1 -1
 * file1.js
 * package.json
 */
const path = require("path");
const fs = require("fs");

const cwd = process.cwd();
const parsedCwd = path.basename(cwd);

// The first two elements in process.argv are the path to node and this script, don't include them
// as they will be different on each platform/device
const passedArgs = process.argv.slice(2).join(" ");

// List all files in the current directory and filter out the exec-test* files
// to focus on the files under test
const files = fs
  .readdirSync(cwd)
  .filter((file) => file.indexOf("exec-test") === -1)
  .join("\n");

console.log(`--> in "${parsedCwd}" with extra args "${passedArgs}"`);
console.log(files);
