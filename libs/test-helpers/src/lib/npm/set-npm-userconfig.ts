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
// C.UTF-8 is the one UTF-8 locale available everywhere (Nx Agents images do not generate
// en_US.UTF-8, so bash-wrapped tools such as mise's bundled npm print setlocale warnings)
process.env.LC_ALL = "C.UTF-8";
