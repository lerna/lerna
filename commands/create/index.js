"use strict";

const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { camelCase } = require("yargs-parser");
const dedent = require("dedent");
const initPackageJson = require("pify")(require("init-package-json"));
const pacote = require("pacote");
const npa = require("npm-package-arg");
const pReduce = require("p-reduce");
const slash = require("slash");

const { Command } = require("@lerna/command");
const childProcess = require("@lerna/child-process");
const npmConf = require("@lerna/npm-conf");
const { ValidationError } = require("@lerna/validation-error");
const { builtinNpmrc } = require("./lib/builtin-npmrc");
const { catFile } = require("./lib/cat-file");

const LERNA_MODULE_DATA = require.resolve("./lib/lerna-module-data.js");
const DEFAULT_DESCRIPTION = [
  "Now I’m the model of a modern major general",
  "The venerated Virginian veteran whose men are all",
  "Lining up, to put me up on a pedestal",
  "Writin’ letters to relatives",
  "Embellishin’ my elegance and eloquence",
  "But the elephant is in the room",
  "The truth is in ya face when ya hear the British cannons go",
  "BOOM",
].join(" / ");

module.exports = factory;

function factory(argv) {
  return new CreateCommand(argv);
}

class CreateCommand extends Command {
  initialize() {
    const {
      bin,
      description = DEFAULT_DESCRIPTION,
      esModule,
      keywords,
      license,
      loc: pkgLocation,
      name: pkgName,
      yes,
    } = this.options;

    // npm-package-arg handles all the edge-cases with scopes
    const { name, scope } = npa(pkgName);

    if (!name && pkgName.includes("/")) {
      throw new ValidationError(
        "ENOPKGNAME",
        "Invalid package name. Use the <loc> positional to specify package directory.\nSee https://github.com/lerna/lerna/tree/main/commands/create#usage for details."
      );
    }

    // optional scope is _not_ included in the directory name
    this.dirName = scope ? name.split("/").pop() : name;
    this.pkgName = name;

    this.pkgsDir = this._getPackagesDir(pkgLocation);

    this.camelName = camelCase(this.dirName);

    // when transpiling, src => dist; otherwise everything in lib
    this.outDir = esModule ? "dist" : "lib";
    this.targetDir = path.resolve(this.pkgsDir, this.dirName);

    this.binDir = path.join(this.targetDir, "bin");
    this.binFileName = bin === true ? this.dirName : bin;

    this.libDir = path.join(this.targetDir, esModule ? "src" : "lib");
    this.libFileName = `${this.dirName}.js`;

    this.testDir = path.join(this.targetDir, "__tests__");
    this.testFileName = `${this.dirName}.test.js`;

    this.conf = npmConf({
      description,
      esModule,
      keywords,
      scope,
      yes,
    });

    // consume "builtin" npm config, if it exists (matches npm cli behaviour)
    this.conf.addFile(builtinNpmrc(), "builtin");

    // always set init-main, it's half of the whole point of this module
    this.conf.set("init-main", `${this.outDir}/${this.libFileName}`);

    if (esModule) {
      this.conf.set("init-es-module", `${this.outDir}/${this.dirName}.module.js`);
    }

    // allow default init-version when independent versioning enabled
    if (!this.project.isIndependent()) {
      this.conf.set("init-version", this.project.version);
    }

    // default author metadata with git config
    if (this.conf.get("init-author-name") === "") {
      this.conf.set("init-author-name", this.gitConfig("user.name"));
    }

    if (this.conf.get("init-author-email") === "") {
      this.conf.set("init-author-email", this.gitConfig("user.email"));
    }

    // override npm_config_init_license if --license provided
    if (license) {
      this.conf.set("init-license", license);
    }

    // pass --private into module data without aggravating eslint
    if (this.options.private) {
      this.conf.set("private", true);
    }

    // silence output if logging is silenced
    // istanbul ignore else
    if (this.options.loglevel === "silent") {
      this.conf.set("silent", true);
    }

    // save read-package-json the trouble
    if (this.binFileName) {
      this.conf.set("bin", {
        [this.binFileName]: `bin/${this.binFileName}`,
      });
    }

    // setting _both_ pkg.bin and pkg.directories.bin is an error
    // https://docs.npmjs.com/files/package.json#directoriesbin
    this.conf.set("directories", {
      lib: this.outDir,
      test: "__tests__",
    });

    this.setFiles();
    this.setHomepage();
    this.setPublishConfig();
    this.setRepository();

    return Promise.resolve(this.setDependencies());
  }

  _getPackagesDir(pkgLocation) {
    const packageParentDirs = this.project.packageParentDirs;

    if (!pkgLocation) {
      return packageParentDirs[0];
    }

    const normalizedPkgLocation = path
      .resolve(this.project.rootPath, path.normalize(pkgLocation))
      .toLowerCase();
    const packageParentDirsLower = packageParentDirs.map((p) => p.toLowerCase());

    // using indexOf over includes due to platform differences (/private/tmp should match /tmp on macOS)
    const matchingPathIndex = packageParentDirsLower.findIndex((p) => p.indexOf(normalizedPkgLocation) > -1);

    if (matchingPathIndex > -1) {
      return packageParentDirs[matchingPathIndex];
    }

    throw new ValidationError(
      "ENOPKGDIR",
      `Location "${pkgLocation}" is not configured as a workspace directory.`
    );
  }

  execute() {
    let chain = Promise.resolve();

    chain = chain.then(() => fs.mkdirp(this.libDir));
    chain = chain.then(() => fs.mkdirp(this.testDir));
    chain = chain.then(() => Promise.all([this.writeReadme(), this.writeLibFile(), this.writeTestFile()]));

    if (this.binFileName) {
      chain = chain.then(() => fs.mkdirp(this.binDir));
      chain = chain.then(() => Promise.all([this.writeBinFile(), this.writeCliFile(), this.writeCliTest()]));
    }

    chain = chain.then(() => initPackageJson(this.targetDir, LERNA_MODULE_DATA, this.conf));

    return chain.then((data) => {
      if (this.options.esModule) {
        this.logger.notice(
          "✔",
          dedent`
              Ensure '${path.relative(".", this.pkgsDir)}/*/${this.outDir}' has been added to ./.gitignore
              Ensure rollup or babel build scripts are in the root
            `
        );
      }

      this.logger.success(
        "create",
        `New package ${data.name} created at ./${path.relative(".", this.targetDir)}`
      );
    });
  }

  gitConfig(prop) {
    return childProcess.execSync("git", ["config", "--get", prop], this.execOpts);
  }

  collectExternalVersions() {
    // collect all current externalDependencies
    const extVersions = new Map();

    for (const { externalDependencies } of this.packageGraph.values()) {
      for (const [name, resolved] of externalDependencies) {
        extVersions.set(name, resolved.fetchSpec);
      }
    }

    return extVersions;
  }

  hasLocalRelativeFileSpec() {
    // if any local dependencies are specified as `file:../dir`,
    // all new local dependencies should be created thusly
    for (const { localDependencies } of this.packageGraph.values()) {
      for (const spec of localDependencies.values()) {
        if (spec.type === "directory") {
          return true;
        }
      }
    }
  }

  resolveRelative(depNode) {
    // a relative file: specifier is _always_ posix
    const relPath = path.relative(this.targetDir, depNode.location);
    const spec = npa.resolve(depNode.name, relPath, this.targetDir);

    return slash(spec.saveSpec);
  }

  setDependencies() {
    const inputs = new Set((this.options.dependencies || []).sort());

    // add yargs if a bin is required
    if (this.options.bin) {
      inputs.add("yargs");
    }

    if (!inputs.size) {
      return;
    }

    const exts = this.collectExternalVersions();
    const localRelative = this.hasLocalRelativeFileSpec();
    const savePrefix = this.conf.get("save-exact") ? "" : this.conf.get("save-prefix");
    const pacoteOpts = this.conf.snapshot;

    const decideVersion = (spec) => {
      if (this.packageGraph.has(spec.name)) {
        // sibling dependency
        const depNode = this.packageGraph.get(spec.name);

        if (localRelative) {
          // a local `file:../foo` specifier
          return this.resolveRelative(depNode);
        }

        // yarn workspace or lerna packages config
        return `${savePrefix}${depNode.version}`;
      }

      if (spec.type === "tag" && spec.fetchSpec === "latest") {
        // resolve the latest version
        if (exts.has(spec.name)) {
          // from local external dependency
          return exts.get(spec.name);
        }

        // from registry
        return pacote.manifest(spec, pacoteOpts).then((pkg) => `${savePrefix}${pkg.version}`);
      }

      if (spec.type === "git") {
        throw new ValidationError("EGIT", "Do not use git dependencies");
      }

      // TODO: resolve this if it's weird? (foo@1, bar@^2, etc)
      return spec.rawSpec;
    };

    let chain = Promise.resolve();

    chain = chain.then(() =>
      pReduce(
        inputs,
        (obj, input) => {
          const spec = npa(input);

          return Promise.resolve(spec)
            .then(decideVersion)
            .then((version) => {
              obj[spec.name] = version;

              return obj;
            });
        },
        {}
      )
    );

    chain = chain.then((dependencies) => {
      this.conf.set("dependencies", dependencies);
    });

    return chain;
  }

  setFiles() {
    // no need to glob for files we already know
    const files = [this.outDir];

    if (this.options.bin) {
      files.unshift("bin");
    }

    this.conf.set("files", files);
  }

  setHomepage() {
    // allow --homepage override, but otherwise use root pkg.homepage, if it exists
    let { homepage = this.project.manifest.get("homepage") } = this.options;

    if (!homepage) {
      // normalize-package-data will backfill from hosted-git-info, if possible
      return;
    }

    // allow schemeless URLs (but don't blow up in URL constructor)
    if (homepage.indexOf("http") !== 0) {
      homepage = `http://${homepage}`;
    }

    const hurl = new URL(homepage);
    const relativeTarget = path.relative(this.project.rootPath, this.targetDir);

    if (hurl.hostname.match("github")) {
      hurl.pathname = path.posix.join(hurl.pathname, "tree/main", relativeTarget);
      // TODO: get actual upstream HEAD branch name
      // current remote: git rev-parse --abbrev-ref --symbolic-full-name @{u}
      // upstream HEAD: git symbolic-ref --short refs/remotes/origin/HEAD
      hurl.hash = "readme";
    } else if (!this.options.homepage) {
      // don't mutate an explicit --homepage value
      hurl.pathname = path.posix.join(hurl.pathname, relativeTarget);
    }

    this.conf.set("homepage", hurl.href);
  }

  setPublishConfig() {
    const scope = this.conf.get("scope");
    const registry = this.options.registry || this.conf.get(`${scope}:registry`) || this.conf.get("registry");
    const isPublicRegistry = registry === this.conf.root.registry;
    const publishConfig = {};

    if (scope && isPublicRegistry) {
      publishConfig.access = this.options.access || "public";
    }

    if (registry && !isPublicRegistry) {
      publishConfig.registry = registry;
    }

    if (this.options.tag) {
      publishConfig.tag = this.options.tag;
    }

    if (Object.keys(publishConfig).length) {
      this.conf.set("publishConfig", publishConfig);
    }
  }

  setRepository() {
    try {
      const url = childProcess.execSync("git", ["remote", "get-url", "origin"], this.execOpts);

      this.conf.set("repository", url);
    } catch (err) {
      this.logger.warn("ENOREMOTE", "No git remote found, skipping repository property");
    }
  }

  writeReadme() {
    const readmeContent = dedent`
      # \`${this.pkgName}\`

      > ${this.options.description || "TODO: description"}

      ## Usage

      \`\`\`
      ${
        // eslint-disable-next-line no-nested-ternary
        this.options.bin
          ? dedent`
            npm -g i ${this.pkgName}

            ${this.binFileName} --help
          `
          : this.options.esModule
          ? `import ${this.camelName} from '${this.pkgName}';`
          : `const ${this.camelName} = require('${this.pkgName}');`
      }

      // TODO: DEMONSTRATE API
      \`\`\`
    `;

    return catFile(this.targetDir, "README.md", readmeContent);
  }

  writeLibFile() {
    const libContent = this.options.esModule
      ? dedent`
        export default function ${this.camelName}() {
            return "Hello from ${this.camelName}";
        }
      `
      : dedent`
        'use strict';

        module.exports = ${this.camelName};

        function ${this.camelName}() {
            return "Hello from ${this.camelName}";
        }
    `;

    return catFile(this.libDir, this.libFileName, libContent);
  }

  writeTestFile() {
    const testContent = this.options.esModule
      ? dedent`
        import ${this.camelName} from '../src/${this.dirName}.js';
        import { strict as assert } from 'assert';

        assert.strictEqual(${this.camelName}(), 'Hello from ${this.camelName}');
        console.info("${this.camelName} tests passed");
      `
      : dedent`
        'use strict';

        const ${this.camelName} = require('..');
        const assert = require('assert').strict;

        assert.strictEqual(${this.camelName}(), 'Hello from ${this.camelName}');
        console.info("${this.camelName} tests passed");
      `;

    return catFile(this.testDir, this.testFileName, testContent);
  }

  writeCliFile() {
    const cliFileName = "cli.js";
    const cliContent = [
      this.options.esModule
        ? dedent`
          import factory from 'yargs/yargs';
          import ${this.camelName} from './${this.dirName}';

          export default cli;
        `
        : dedent`
          'use strict';

          const factory = require('yargs/yargs');
          const ${this.camelName} = require('./${this.dirName}');

          module.exports = cli;
        `,
      "", // blank line
      dedent`
        function cli(cwd) {
          const parser = factory(null, cwd);

          parser.alias('h', 'help');
          parser.alias('v', 'version');

          parser.usage(
            "$0",
            "TODO: description",
            yargs => {
              yargs.options({
                // TODO: options
              });
            },
            argv => ${this.camelName}(argv)
          );

          return parser;
        }
      `,
    ].join(os.EOL);

    return catFile(this.libDir, cliFileName, cliContent);
  }

  writeCliTest() {
    const cliTestFileName = "cli.test.js";
    const cliTestContent = [
      this.options.esModule
        ? dedent`
          import cli from '../src/cli';
        `
        : dedent`
          'use strict';

          const cli = require('../lib/cli');
        `,
      "", // blank line
      dedent`
        describe('${this.pkgName} cli', () => {
          // const argv = cli(cwd).parse(['args']);
          it('needs tests');
        });
      `,
    ].join(os.EOL);

    return catFile(this.testDir, cliTestFileName, cliTestContent);
  }

  writeBinFile() {
    const binContent = dedent`
      #!/usr/bin/env node

      'use strict';

      // eslint-disable-next-line no-unused-expressions
      require('../${this.outDir}/cli')${
      this.options.esModule ? ".default" : ""
    }().parse(process.argv.slice(2));`;

    return catFile(this.binDir, this.binFileName, binContent, { mode: 0o755 });
  }
}

module.exports.CreateCommand = CreateCommand;
