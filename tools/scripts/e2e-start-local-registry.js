/* eslint-disable no-console */
/* eslint-disable no-process-exit */
const { exec } = require("child_process");

const verdacio = exec("npx verdaccio --config ./tools/scripts/local-registry/config.yml");
verdacio.unref();

console.log("starting local registry");
function outputHandling(data) {
  console.log(data.toString());
  if (data.toString().indexOf("address already in use") > -1) {
    console.log("Ignoring the error. The local registry is already running.");
    process.exit(0);
  }
}

verdacio.stdout.on("data", outputHandling);
verdacio.stderr.on("data", outputHandling);
verdacio.on("exit", (code) => process.exit(code));

setTimeout(() => process.exit(0), 2000);
