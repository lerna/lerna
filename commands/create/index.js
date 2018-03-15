"use strict";

const fs = require("fs-extra");
const path = require("path");
const { URL } = require("url");
const dedent = require("dedent");
const init = require("init-package-json");
const npa = require("npm-package-arg");
const npmConf = require("npm-conf");
const pify = require("pify");
const _ = require("lodash");

const Command = require("@lerna/command");
const ChildProcessUtilities = require("@lerna/child-process");

const LERNA_MODULE_DATA = path.join(__dirname, "lerna-module-data.js");

class CreateCommand extends Command {
  get requireGit() {
    return false;
  }

  initialize() {
    const { description, esModule, keywords, license, location, outdir, pkgName, scope, yes } = this.options;

    this.pkgName = pkgName;
    this.pkgsDir =
      this.repository.packageParentDirs.find(pd => pd.indexOf(location) > -1) ||
      this.repository.packageParentDirs[0];

    this.outDir = outdir || "lib";
    this.targetDir = path.resolve(this.pkgsDir, this.pkgName);

    this.libFileName = `${pkgName}.js`;
    this.testFileName = `${pkgName}.test.js`;
    this.mainFilePath = path.join(outdir, this.libFileName);

    const dependencies = this.parseDependencies(this.options.dependencies);
    const devDependencies = this.parseDependencies(this.options.devDependencies);
    const homepage = this.getHomepage();
    const publishConfig = this.getPublishConfig();

    this.conf = npmConf({
      dependencies,
      devDependencies,
      description,
      esModule,
      keywords,
      homepage,
      publishConfig,
      scope,
      yes,
    });

    // consume "builtin" npm config, if it exists (matches npm cli behaviour)
    const globalNpmBin = path.resolve(path.dirname(process.execPath), "npm");
    const builtinNpmrc = path.resolve(fs.realpathSync(globalNpmBin), "../../npmrc");
    this.conf.addFile(builtinNpmrc, "builtin");

    // always set init-main, it's half of the whole point of this module
    this.conf.set("init-main", this.mainFilePath);

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

    this.camelName = _.camelCase(pkgName);
    this.fullPackageName = scope ? `${scope}/${pkgName}` : pkgName;

    this.binDir = path.join(this.targetDir, "bin");
    this.libDir = path.join(this.targetDir, esModule ? "src" : "lib");
    this.testDir = path.join(this.targetDir, "test");
  }

  execute() {
    const { bin, esModule } = this.options;
    const actions = [this.writeReadme(), this.writeLibFile(), this.writeTestFile()];

    if (bin) {
      actions.push(this.writeBinFiles());
    }

    return Promise.all(actions)
      .then(() => pify(init)(this.targetDir, LERNA_MODULE_DATA, this.conf))
      .then(data => {
        this.logger.success(
          "create",
          `New package ${data.name} created at ./${path.relative(".", this.targetDir)}`
        );

        if (esModule) {
          this.logger.notice(
            "NOTE",
            dedent`
              Ensure you have added '${this.pkgsDir}/*/${this.outDir}' to your root .gitignore
              and have the appropriate rollup or babel build scripts in the root.
            `
          );
        }
      });
  }

  catFile(dir, name, data, opts = "utf8") {
    return fs.outputFile(path.join(dir, name), `${data}\n`, opts);
  }

  getHomepage() {
    const hurl = new URL(this.repository.package.homepage);
    const relativeTarget = path.relative(this.repository.rootPath, this.targetDir);

    if (hurl.hostname.match("github")) {
      hurl.pathname = path.posix.join(hurl.pathname, "tree/master", relativeTarget);
      // TODO: get actual upstream HEAD branch name
      // current remote: git rev-parse --abbrev-ref --symbolic-full-name @{u}
      // upstream HEAD: git symbolic-ref --short refs/remotes/origin/HEAD
      hurl.hash = "readme";
    } else {
      hurl.pathname = path.posix.join(hurl.pathname, relativeTarget);
    }

    return hurl.href;
  }

  getPublishConfig() {
    const { access, registry, scope, tag } = this.options;
    const publishConfig = {};

    if (scope) {
      publishConfig.access = access || "public";
    }

    if (registry) {
      publishConfig.registry = registry;
    }

    if (tag) {
      publishConfig.tag = tag;
    }

    if (Object.keys(publishConfig).length) {
      return publishConfig;
    }
  }

  gitConfig(prop) {
    return ChildProcessUtilities.execSync("git", ["config", "--get", prop], this.execOpts);
  }

  latestVersion(depName) {
    return ChildProcessUtilities.execSync("npm", ["info", depName, "version"], this.execOpts);
  }

  parseDependencies(inputs) {
    const tuples = _.map(inputs, input => {
      const parsed = npa(input);
      const depType = parsed.type;
      const depName = parsed.name;

      let version = parsed.rawSpec;

      if (this.packageGraph.has(depName)) {
        // sibling dependency
        version = `^${this.packageGraph.get(depName).version}`;
      } else if (depType === "tag" && parsed.fetchSpec === "latest") {
        // resolve the latest version
        version = `^${this.latestVersion(depName)}`;
      } else if (depType === "git" || depType === "hosted") {
        throw new Error("Do not use git dependencies");
      }

      return [depName, version];
    });

    // alpha sort just like npm does
    return _.fromPairs(_.sortBy(tuples, "0"));
  }

  writeReadme() {
    const readmeContent = dedent`
      # \`${this.fullPackageName}\`

      > ${this.options.description || "BRIEF DESCRIPTION"}

      ## Usage

      \`\`\`
      ${
        this.options.esModule
          ? `import ${this.camelName} from '${this.fullPackageName}';`
          : `const ${this.camelName} = require('${this.fullPackageName}');`
      }

      // DEMONSTRATE PUBLIC API
      \`\`\`
    `;

    return this.catFile(this.targetDir, "README.md", readmeContent);
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

    return this.catFile(this.libDir, this.libFileName, libContent);
  }

  writeTestFile() {
    const testContent = this.options.esModule
      ? dedent`
        import ${this.camelName} from '../src/${this.packageName}';

        describe('${this.packageName}', () => {
            it('needs tests');
        });
      `
      : dedent`
        'use strict';

        const ${this.camelName} = require('../');

        describe('${this.packageName}', () => {
            it('needs tests');
        });
      `;

    return this.catFile(this.testDir, this.testFileName, testContent);
  }

  writeBinFiles() {
    const { bin, esModule } = this.options;

    const cliFileName = "cli.js";
    const cliContent = esModule
      ? dedent`
        import yargs from 'yargs/yargs';

        export default function cli(argv, cwd) {
          return yargs(argv, cwd)
            .usage('TODO')
            .options({
              // TODO
            })
            .alias('h', 'help')
            .alias('v', 'version');
        }
      `
      : dedent`
        'use strict';

        const yargs = require('yargs/yargs');

        module.exports = function cli(argv, cwd) {
          return yargs(argv, cwd)
            .usage('TODO')
            .options({
              // TODO
            })
            .alias('h', 'help')
            .alias('v', 'version');
        };
      `;

    const cliTestFileName = "cli.test.js";
    const cliTestContent = esModule
      ? dedent`
        import cli from '../src/cli';

        describe('${this.packageName} cli', () => {
          // const argv = cli().parse(['args'], cb);
          it('needs tests');
        });
      `
      : dedent`
        'use strict';

        const cli = require('../lib/cli');

        describe('${this.packageName} cli', () => {
          // const argv = cli().parse(['args'], cb);
          it('needs tests');
        });
      `;

    const binFileName = bin === true ? this.packageName : bin;
    const binContent = dedent`
      #!/usr/bin/env node
      'use strict';

      // eslint-disable-next-line no-unused-expressions
      require('../lib/cli')${esModule ? ".default" : ""}().parse(process.argv.slice(2));
    `;

    return Promise.all([
      this.catFile(this.binDir, binFileName, binContent, { mode: 0o755 }),
      this.catFile(this.libDir, cliFileName, cliContent),
      this.catFile(this.testDir, cliTestFileName, cliTestContent),
    ]);
  }
}

module.exports = CreateCommand;
