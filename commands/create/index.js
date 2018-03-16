"use strict";

const path = require("path");
const os = require("os");
const { URL } = require("url");
const camelCase = require("camelcase");
const dedent = require("dedent");
const initPackageJson = require("init-package-json");
const npa = require("npm-package-arg");
const npmConf = require("npm-conf");
const pify = require("pify");

const Command = require("@lerna/command");
const ChildProcessUtilities = require("@lerna/child-process");
const builtinNpmrc = require("./lib/builtin-npmrc");
const catFile = require("./lib/cat-file");

const LERNA_MODULE_DATA = path.join(__dirname, "lerna-module-data.js");
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

class CreateCommand extends Command {
  get requireGit() {
    return false;
  }

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

    // disable progress so promzard doesn't get ganked
    this.logger.disableProgress();

    // npm-package-arg handles all the edge-cases with scopes
    const { name, scope } = npa(pkgName);

    // optional scope is _not_ included in the directory name
    this.dirName = scope ? name.split("/").pop() : name;
    this.pkgName = name;
    this.pkgsDir =
      this.repository.packageParentDirs.find(pd => pd.indexOf(pkgLocation) > -1) ||
      this.repository.packageParentDirs[0];

    this.camelName = camelCase(this.dirName);

    // when transpiling, src => dist; otherwise everything in lib
    this.outDir = esModule ? "dist" : "lib";
    this.targetDir = path.resolve(this.pkgsDir, this.dirName);

    this.binDir = path.join(this.targetDir, "bin");
    this.binFileName = bin === true ? this.dirName : bin;

    this.libDir = path.join(this.targetDir, esModule ? "src" : "lib");
    this.libFileName = `${this.dirName}.js`;

    this.testFileName = `${this.dirName}.test.js`;
    this.testDir = path.join(this.targetDir, "__tests__");

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
    this.conf.set("init-main", path.posix.join(this.outDir, this.libFileName));

    // allow default init-version when independent versioning enabled
    if (!this.repository.isIndependent()) {
      this.conf.set("init-version", this.repository.version);
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
    if (this.options.loglevel === "silent") {
      this.conf.set("silent", true);
    }

    this.setHomepage();
    this.setPublishConfig();
    this.setRepository();
    this.setDependencies();
  }

  execute() {
    const { bin, esModule } = this.options;
    const actions = [this.writeReadme(), this.writeLibFile(), this.writeTestFile()];

    if (bin) {
      actions.push(...this.writeBinFiles());
    }

    return Promise.all(actions)
      .then(() => pify(initPackageJson)(this.targetDir, LERNA_MODULE_DATA, this.conf))
      .then(data => {
        if (esModule) {
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
    return ChildProcessUtilities.execSync("git", ["config", "--get", prop], this.execOpts);
  }

  latestVersion(depName) {
    return ChildProcessUtilities.execSync("npm", ["info", depName, "version"], this.execOpts);
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

  setDependencies() {
    const inputs = new Set(this.options.dependencies);

    // add yargs if a bin is required
    if (this.options.bin) {
      inputs.add("yargs");
    }

    if (!inputs.size) {
      return;
    }

    const dependencies = {};
    const exts = this.collectExternalVersions();
    const localRelative = this.hasLocalRelativeFileSpec();
    const savePrefix = this.conf.get("save-exact") ? "" : this.conf.get("save-prefix");

    for (const spec of [...inputs].sort().map(i => npa(i))) {
      const depType = spec.type;
      const depName = spec.name;

      let version = spec.rawSpec;

      if (this.packageGraph.has(depName)) {
        // sibling dependency
        const depNode = this.packageGraph.get(depName);

        if (localRelative) {
          // a local `file:../foo` specifier
          const relPath = path.relative(this.targetDir, depNode.location);
          version = npa.resolve(depName, relPath, this.targetDir).saveSpec;
        } else {
          // yarn workspace or lerna packages config
          version = `${savePrefix}${depNode.version}`;
        }
      } else if (depType === "tag" && spec.fetchSpec === "latest") {
        // resolve the latest version
        if (exts.has(depName)) {
          // from local external dependency
          version = exts.get(depName);
        } else {
          // from registry
          version = `${savePrefix}${this.latestVersion(depName)}`;
        }
      } else if (depType === "git" || depType === "hosted") {
        throw new Error("Do not use git dependencies");
      }

      dependencies[depName] = version;
    }

    this.conf.set("dependencies", dependencies);
  }

  setHomepage() {
    // allow --homepage override, but otherwise use root pkg.homepage, if it exists
    let { homepage = this.repository.package.json.homepage } = this.options;

    if (!homepage) {
      // normalize-package-data will backfill from hosted-git-info, if possible
      return;
    }

    // allow schemeless URLs (but don't blow up in URL constructor)
    if (homepage.indexOf("http") !== 0) {
      homepage = `http://${homepage}`;
    }

    const hurl = new URL(homepage);
    const relativeTarget = path.relative(this.repository.rootPath, this.targetDir);

    if (hurl.hostname.match("github")) {
      hurl.pathname = path.posix.join(hurl.pathname, "tree/master", relativeTarget);
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
    this.conf.set(
      "repository",
      ChildProcessUtilities.execSync("git", ["remote", "get-url", "origin"], this.execOpts)
    );
  }

  writeReadme() {
    const { bin, description } = this.options;
    const readmeContent = dedent`
      # \`${this.pkgName}\`

      > ${description || "TODO: description"}

      ## Usage

      \`\`\`
      ${
        // eslint-disable-next-line no-nested-ternary
        bin
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
            // TODO
        }
      `
      : dedent`
        'use strict';

        module.exports = ${this.camelName};

        function ${this.camelName}() {
            // TODO
        }
    `;

    return catFile(this.libDir, this.libFileName, libContent);
  }

  writeTestFile() {
    const testContent = this.options.esModule
      ? dedent`
        import ${this.camelName} from '../src/${this.pkgName}';

        describe('${this.pkgName}', () => {
            it('needs tests');
        });
      `
      : dedent`
        'use strict';

        const ${this.camelName} = require('..');

        describe('${this.pkgName}', () => {
            it('needs tests');
        });
      `;

    return catFile(this.testDir, this.testFileName, testContent);
  }

  writeBinFiles() {
    const { esModule } = this.options;

    const cliFileName = "cli.js";
    const cliContent = [
      esModule
        ? dedent`
          import factory from 'yargs/yargs';
          import ${this.camelName} from './${this.pkgName}';

          export default cli;
        `
        : dedent`
          'use strict';

          const yargs = require('yargs/yargs');
          const ${this.camelName} = require('./${this.pkgName}');

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

    const cliTestFileName = "cli.test.js";
    const cliTestContent = [
      esModule
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

    const binContent = dedent`
      #!/usr/bin/env node

      'use strict';

      // eslint-disable-next-line no-unused-expressions
      require('../${this.outDir}/cli')${esModule ? ".default" : ""}().parse(process.argv.slice(2));
    `;

    return [
      catFile(this.binDir, this.binFileName, binContent, { encoding: "utf8", mode: 0o755 }),
      catFile(this.libDir, cliFileName, cliContent),
      catFile(this.testDir, cliTestFileName, cliTestContent),
    ];
  }
}

module.exports = CreateCommand;
