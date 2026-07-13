import path from "path";

// Remove npm_config_* variables injected by the npm/npx process that launched
// the test runner (they mirror the developer's real npmrc files and would
// override the userconfig fixture below, e.g. ignore-scripts=true)
for (const key of Object.keys(process.env)) {
  if (/^npm_config_/i.test(key)) {
    delete process.env[key];
  }
}

// Overwrite npm userconfig to avoid test pollution
// https://docs.npmjs.com/misc/config#npmrc-files
process.env.npm_config_userconfig = path.resolve(__dirname, "test-user.ini");

// use consistent locale for all tests
process.env.LC_ALL = "en_US.UTF-8";
