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
    const { description, esModule, keywords, license, loc, name: pkgName, outdir, yes } = this.options;
    const { name, scope } = npa(pkgName);

    // disable progress so promzard doesn't get ganked
    this.logger.disableProgress();

    this.dirName = scope ? name.split("/").pop() : name;
    this.pkgName = name;
    this.pkgsDir =
      this.repository.packageParentDirs.find(pd => pd.indexOf(loc) > -1) ||
      this.repository.packageParentDirs[0];

    this.outDir = outdir || "lib";
    this.targetDir = path.resolve(this.pkgsDir, this.dirName);
    this.camelName = _.camelCase(this.dirName);

    this.libFileName = `${this.dirName}.js`;
    this.testFileName = `${this.dirName}.test.js`;
    this.mainFilePath = path.join(this.outDir, this.libFileName);

    const dependencies = this.parseDependencies();

    this.conf = npmConf({
      dependencies,
      description,
      esModule,
      keywords,
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

    this.setHomepage();
    this.setPublishConfig();

    this.binDir = path.join(this.targetDir, "bin");
    this.libDir = path.join(this.targetDir, esModule ? "src" : "lib");
    this.testDir = path.join(this.targetDir, "__tests__");
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

  setHomepage() {
    const { homepage } = this.repository.package.json;

    if (!homepage) {
      // normalize-package-data will backfill from hosted-git-info, if possible
      return;
    }

    const hurl = new URL(homepage);
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

  gitConfig(prop) {
    return ChildProcessUtilities.execSync("git", ["config", "--get", prop], this.execOpts);
  }

  latestVersion(depName) {
    return ChildProcessUtilities.execSync("npm", ["info", depName, "version"], this.execOpts);
  }

  parseDependencies() {
    const inputs = this.options.dependencies;
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
      # \`${this.pkgName}\`

      > ${this.options.description || "BRIEF DESCRIPTION"}

      ## Usage

      \`\`\`
      ${
        this.options.esModule
          ? `import ${this.camelName} from '${this.pkgName}';`
          : `const ${this.camelName} = require('${this.pkgName}');`
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

        describe('${this.pkgName} cli', () => {
          // const argv = cli().parse(['args'], cb);
          it('needs tests');
        });
      `
      : dedent`
        'use strict';

        const cli = require('../lib/cli');

        describe('${this.pkgName} cli', () => {
          // const argv = cli().parse(['args'], cb);
          it('needs tests');
        });
      `;

    const binFileName = bin === true ? this.pkgName : bin;
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
