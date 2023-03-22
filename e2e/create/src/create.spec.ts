import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str) {
    return normalizeEnvironment(str)
      .replaceAll(/"author": ".*"/g, '"author": "<author>"')
      .replaceAll(/"url": ".*\/lerna-create\/origin\.git"/g, '"url": "<url>/lerna-create/origin.git"')
      .replaceAll(/"yarn": "\^\d?\d.\d?\d.\d?\d"/g, '"yarn": "^XX.XX.XX"')
      .replaceAll(/"lerna": "\^\d?\d.\d?\d.\d?\d"/g, '"lerna": "^XX.XX.XX"')
      .replaceAll(/"yargs": "\^\d?\d.\d?\d.\d?\d"/g, '"yargs": "^XX.XX.XX"')
      .replaceAll(/in \d*\.\d*s/g, "in X.Xs");
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-create", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-create",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
    await fixture.updateJson("lerna.json", (json) => ({
      ...json,
      packages: ["packages/*", "apps/*", "libs/react/*"],
    }));
  });
  afterAll(() => fixture.destroy());

  describe("with no options", () => {
    beforeAll(async () => {
      await fixture.lerna("create no-options -y");
    });

    it("should create README.MD", async () => {
      const file = await fixture.readWorkspaceFile("packages/no-options/README.md");
      expect(file).toMatchInlineSnapshot(`
        # \`no-options\`

        > TODO: description

        ## Usage

        \`\`\`
        const noOptions = require('no-options');

        // TODO: DEMONSTRATE API
        \`\`\`

      `);
    });

    it("should create package.json", async () => {
      const file = await fixture.readWorkspaceFile("packages/no-options/package.json");
      expect(file).toMatchInlineSnapshot(`
        {
          "name": "no-options",
          "version": "0.0.0",
          "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
          "keywords": [],
          "author": "<author>",
          "license": "ISC",
          "main": "lib/no-options.js",
          "directories": {
            "lib": "lib",
            "test": "__tests__"
          },
          "files": [
            "lib"
          ],
          "repository": {
            "type": "git",
            "url": "<url>/lerna-create/origin.git"
          },
          "scripts": {
            "test": "node ./__tests__/no-options.test.js"
          }
        }

      `);
    });

    it("should create lib file", async () => {
      const file = await fixture.readWorkspaceFile("packages/no-options/lib/no-options.js");
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        module.exports = noOptions;

        function noOptions() {
          return 'Hello from noOptions';
        }

      `);
    });

    it("should create test file", async () => {
      const file = await fixture.readWorkspaceFile("packages/no-options/__tests__/no-options.test.js");
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        const noOptions = require('..');
        const assert = require('assert').strict;

        assert.strictEqual(noOptions(), 'Hello from noOptions');
        console.info('noOptions tests passed');

      `);
    });
  });

  describe("--bin", () => {
    const packageName = "option-bin";

    beforeAll(async () => {
      await fixture.lerna(`create ${packageName} -y --bin test-bin-name`, { allowNetworkRequests: true });
    });

    it("should create README.MD", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
      expect(file).toMatchInlineSnapshot(`
        # \`option-bin\`

        > TODO: description

        ## Usage

        \`\`\`
        npm -g i option-bin

        test-bin-name --help

        // TODO: DEMONSTRATE API
        \`\`\`

      `);
    });

    it("should create package.json", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
      expect(file).toMatchInlineSnapshot(`
        {
          "name": "option-bin",
          "version": "0.0.0",
          "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
          "keywords": [],
          "author": "<author>",
          "license": "ISC",
          "main": "lib/option-bin.js",
          "bin": {
            "test-bin-name": "bin/test-bin-name"
          },
          "directories": {
            "lib": "lib",
            "test": "__tests__"
          },
          "files": [
            "bin",
            "lib"
          ],
          "repository": {
            "type": "git",
            "url": "<url>/lerna-create/origin.git"
          },
          "scripts": {
            "test": "node ./__tests__/option-bin.test.js"
          },
          "dependencies": {
            "yargs": "^XX.XX.XX"
          }
        }

      `);
    });

    it("should create lib file", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        module.exports = optionBin;

        function optionBin() {
          return 'Hello from optionBin';
        }

      `);
    });

    it("should create test file", async () => {
      const file = await fixture.readWorkspaceFile(
        `packages/${packageName}/__tests__/${packageName}.test.js`
      );
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        const optionBin = require('..');
        const assert = require('assert').strict;

        assert.strictEqual(optionBin(), 'Hello from optionBin');
        console.info('optionBin tests passed');

      `);
    });
  });

  describe("--description", () => {
    const packageName = "option-description";

    beforeAll(async () => {
      await fixture.lerna(`create ${packageName} -y --description="This is a test description."`);
    });

    it("should create README.MD", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
      expect(file).toMatchInlineSnapshot(`
        # \`option-description\`

        > This is a test description.

        ## Usage

        \`\`\`
        const optionDescription = require('option-description');

        // TODO: DEMONSTRATE API
        \`\`\`

      `);
    });

    it("should create package.json", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
      expect(file).toMatchInlineSnapshot(`
        {
          "name": "option-description",
          "version": "0.0.0",
          "description": "This is a test description.",
          "keywords": [],
          "author": "<author>",
          "license": "ISC",
          "main": "lib/option-description.js",
          "directories": {
            "lib": "lib",
            "test": "__tests__"
          },
          "files": [
            "lib"
          ],
          "repository": {
            "type": "git",
            "url": "<url>/lerna-create/origin.git"
          },
          "scripts": {
            "test": "node ./__tests__/option-description.test.js"
          }
        }

      `);
    });

    it("should create lib file", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        module.exports = optionDescription;

        function optionDescription() {
          return 'Hello from optionDescription';
        }

      `);
    });

    it("should create test file", async () => {
      const file = await fixture.readWorkspaceFile(
        `packages/${packageName}/__tests__/${packageName}.test.js`
      );
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        const optionDescription = require('..');
        const assert = require('assert').strict;

        assert.strictEqual(optionDescription(), 'Hello from optionDescription');
        console.info('optionDescription tests passed');

      `);
    });
  });

  describe("--dependencies", () => {
    const packageName = "option-dependencies";

    beforeAll(async () => {
      await fixture.lerna(`create ${packageName} -y --dependencies yarn@latest lodash@3.0.0 lerna`, {
        allowNetworkRequests: true,
      });
    });

    it("should create README.MD", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
      expect(file).toMatchInlineSnapshot(`
        # \`option-dependencies\`

        > TODO: description

        ## Usage

        \`\`\`
        const optionDependencies = require('option-dependencies');

        // TODO: DEMONSTRATE API
        \`\`\`

      `);
    });

    it("should create package.json", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
      expect(file).toMatchInlineSnapshot(`
        {
          "name": "option-dependencies",
          "version": "0.0.0",
          "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
          "keywords": [],
          "author": "<author>",
          "license": "ISC",
          "main": "lib/option-dependencies.js",
          "directories": {
            "lib": "lib",
            "test": "__tests__"
          },
          "files": [
            "lib"
          ],
          "repository": {
            "type": "git",
            "url": "<url>/lerna-create/origin.git"
          },
          "scripts": {
            "test": "node ./__tests__/option-dependencies.test.js"
          },
          "dependencies": {
            "lerna": "^XX.XX.XX",
            "lodash": "3.0.0",
            "yarn": "^XX.XX.XX"
          }
        }

      `);
    });

    it("should create lib file", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        module.exports = optionDependencies;

        function optionDependencies() {
          return 'Hello from optionDependencies';
        }

      `);
    });

    it("should create test file", async () => {
      const file = await fixture.readWorkspaceFile(
        `packages/${packageName}/__tests__/${packageName}.test.js`
      );
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        const optionDependencies = require('..');
        const assert = require('assert').strict;

        assert.strictEqual(optionDependencies(), 'Hello from optionDependencies');
        console.info('optionDependencies tests passed');

      `);
    });
  });

  describe("--es-module", () => {
    const packageName = "option-es-module";

    beforeAll(async () => {
      await fixture.lerna(`create ${packageName} -y --es-module`);
    });

    it("should create README.MD", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
      expect(file).toMatchInlineSnapshot(`
        # \`option-es-module\`

        > TODO: description

        ## Usage

        \`\`\`
        import optionEsModule from 'option-es-module';

        // TODO: DEMONSTRATE API
        \`\`\`

      `);
    });

    it("should create package.json", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
      expect(file).toMatchInlineSnapshot(`
        {
          "name": "option-es-module",
          "version": "0.0.0",
          "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
          "keywords": [],
          "author": "<author>",
          "license": "ISC",
          "main": "dist/option-es-module.js",
          "module": "dist/option-es-module.module.js",
          "directories": {
            "lib": "dist",
            "test": "__tests__"
          },
          "files": [
            "dist"
          ],
          "repository": {
            "type": "git",
            "url": "<url>/lerna-create/origin.git"
          },
          "scripts": {
            "test": "node ./__tests__/option-es-module.test.js"
          },
          "type": "module"
        }

      `);
    });

    it("should create src file", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/src/${packageName}.js`);
      expect(file).toMatchInlineSnapshot(`
        export default function optionEsModule() {
          return 'Hello from optionEsModule';
        }

      `);
    });

    it("should create test file", async () => {
      const file = await fixture.readWorkspaceFile(
        `packages/${packageName}/__tests__/${packageName}.test.js`
      );
      expect(file).toMatchInlineSnapshot(`
        import optionEsModule from '../src/option-es-module.js';
        import { strict as assert } from 'assert';

        assert.strictEqual(optionEsModule(), 'Hello from optionEsModule');
        console.info('optionEsModule tests passed');

      `);
    });
  });

  describe("--homepage", () => {
    const packageName = "option-homepage";

    beforeAll(async () => {
      await fixture.lerna(`create ${packageName} -y --homepage "https://option-homepage-test.com"`);
    });

    it("should create README.MD", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
      expect(file).toMatchInlineSnapshot(`
        # \`option-homepage\`

        > TODO: description

        ## Usage

        \`\`\`
        const optionHomepage = require('option-homepage');

        // TODO: DEMONSTRATE API
        \`\`\`

      `);
    });

    it("should create package.json", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
      expect(file).toMatchInlineSnapshot(`
        {
          "name": "option-homepage",
          "version": "0.0.0",
          "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
          "keywords": [],
          "author": "<author>",
          "homepage": "https://option-homepage-test.com/",
          "license": "ISC",
          "main": "lib/option-homepage.js",
          "directories": {
            "lib": "lib",
            "test": "__tests__"
          },
          "files": [
            "lib"
          ],
          "repository": {
            "type": "git",
            "url": "<url>/lerna-create/origin.git"
          },
          "scripts": {
            "test": "node ./__tests__/option-homepage.test.js"
          }
        }

      `);
    });

    it("should create lib file", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        module.exports = optionHomepage;

        function optionHomepage() {
          return 'Hello from optionHomepage';
        }

      `);
    });

    it("should create test file", async () => {
      const file = await fixture.readWorkspaceFile(
        `packages/${packageName}/__tests__/${packageName}.test.js`
      );
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        const optionHomepage = require('..');
        const assert = require('assert').strict;

        assert.strictEqual(optionHomepage(), 'Hello from optionHomepage');
        console.info('optionHomepage tests passed');

      `);
    });
  });

  describe("--keywords", () => {
    const packageName = "option-keywords";

    beforeAll(async () => {
      await fixture.lerna(`create ${packageName} -y --keywords test example e2e`);
    });

    it("should create README.MD", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
      expect(file).toMatchInlineSnapshot(`
        # \`option-keywords\`

        > TODO: description

        ## Usage

        \`\`\`
        const optionKeywords = require('option-keywords');

        // TODO: DEMONSTRATE API
        \`\`\`

      `);
    });

    it("should create package.json", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
      expect(file).toMatchInlineSnapshot(`
        {
          "name": "option-keywords",
          "version": "0.0.0",
          "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
          "keywords": [
            "test",
            "example",
            "e2e"
          ],
          "author": "<author>",
          "license": "ISC",
          "main": "lib/option-keywords.js",
          "directories": {
            "lib": "lib",
            "test": "__tests__"
          },
          "files": [
            "lib"
          ],
          "repository": {
            "type": "git",
            "url": "<url>/lerna-create/origin.git"
          },
          "scripts": {
            "test": "node ./__tests__/option-keywords.test.js"
          }
        }

      `);
    });

    it("should create lib file", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        module.exports = optionKeywords;

        function optionKeywords() {
          return 'Hello from optionKeywords';
        }

      `);
    });

    it("should create test file", async () => {
      const file = await fixture.readWorkspaceFile(
        `packages/${packageName}/__tests__/${packageName}.test.js`
      );
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        const optionKeywords = require('..');
        const assert = require('assert').strict;

        assert.strictEqual(optionKeywords(), 'Hello from optionKeywords');
        console.info('optionKeywords tests passed');

      `);
    });
  });

  describe("--license", () => {
    const packageName = "option-license";

    beforeAll(async () => {
      await fixture.lerna(`create ${packageName} -y --license=MIT`);
    });

    it("should create README.MD", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
      expect(file).toMatchInlineSnapshot(`
        # \`option-license\`

        > TODO: description

        ## Usage

        \`\`\`
        const optionLicense = require('option-license');

        // TODO: DEMONSTRATE API
        \`\`\`

      `);
    });

    it("should create package.json", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
      expect(file).toMatchInlineSnapshot(`
        {
          "name": "option-license",
          "version": "0.0.0",
          "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
          "keywords": [],
          "author": "<author>",
          "license": "MIT",
          "main": "lib/option-license.js",
          "directories": {
            "lib": "lib",
            "test": "__tests__"
          },
          "files": [
            "lib"
          ],
          "repository": {
            "type": "git",
            "url": "<url>/lerna-create/origin.git"
          },
          "scripts": {
            "test": "node ./__tests__/option-license.test.js"
          }
        }

      `);
    });

    it("should create lib file", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        module.exports = optionLicense;

        function optionLicense() {
          return 'Hello from optionLicense';
        }

      `);
    });

    it("should create test file", async () => {
      const file = await fixture.readWorkspaceFile(
        `packages/${packageName}/__tests__/${packageName}.test.js`
      );
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        const optionLicense = require('..');
        const assert = require('assert').strict;

        assert.strictEqual(optionLicense(), 'Hello from optionLicense');
        console.info('optionLicense tests passed');

      `);
    });
  });

  describe("--private", () => {
    const packageName = "option-private";

    beforeAll(async () => {
      await fixture.lerna(`create ${packageName} -y --private`);
    });

    it("should create README.MD", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
      expect(file).toMatchInlineSnapshot(`
        # \`option-private\`

        > TODO: description

        ## Usage

        \`\`\`
        const optionPrivate = require('option-private');

        // TODO: DEMONSTRATE API
        \`\`\`

      `);
    });

    it("should create package.json", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
      expect(file).toMatchInlineSnapshot(`
        {
          "name": "option-private",
          "version": "0.0.0",
          "private": true,
          "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
          "keywords": [],
          "author": "<author>",
          "license": "ISC",
          "main": "lib/option-private.js",
          "directories": {
            "lib": "lib",
            "test": "__tests__"
          },
          "files": [
            "lib"
          ],
          "repository": {
            "type": "git",
            "url": "<url>/lerna-create/origin.git"
          },
          "scripts": {
            "test": "node ./__tests__/option-private.test.js"
          }
        }

      `);
    });

    it("should create lib file", async () => {
      const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        module.exports = optionPrivate;

        function optionPrivate() {
          return 'Hello from optionPrivate';
        }

      `);
    });

    it("should create test file", async () => {
      const file = await fixture.readWorkspaceFile(
        `packages/${packageName}/__tests__/${packageName}.test.js`
      );
      expect(file).toMatchInlineSnapshot(`
        'use strict';

        const optionPrivate = require('..');
        const assert = require('assert').strict;

        assert.strictEqual(optionPrivate(), 'Hello from optionPrivate');
        console.info('optionPrivate tests passed');

      `);
    });
  });

  describe("with a npm scope", () => {
    describe("with no options", () => {
      const packageName = "with-scope";

      beforeAll(async () => {
        await fixture.lerna(`create @scope/${packageName} -y`);
      });

      it("should create README.MD", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
        expect(file).toMatchInlineSnapshot(`
          # \`@scope/with-scope\`

          > TODO: description

          ## Usage

          \`\`\`
          const withScope = require('@scope/with-scope');

          // TODO: DEMONSTRATE API
          \`\`\`

        `);
      });

      it("should create package.json", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
        expect(file).toMatchInlineSnapshot(`
          {
            "name": "@scope/with-scope",
            "version": "0.0.0",
            "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
            "keywords": [],
            "author": "<author>",
            "license": "ISC",
            "main": "lib/with-scope.js",
            "directories": {
              "lib": "lib",
              "test": "__tests__"
            },
            "files": [
              "lib"
            ],
            "publishConfig": {
              "access": "public"
            },
            "repository": {
              "type": "git",
              "url": "<url>/lerna-create/origin.git"
            },
            "scripts": {
              "test": "node ./__tests__/@scope/with-scope.test.js"
            }
          }

        `);
      });

      it("should create lib file", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
        expect(file).toMatchInlineSnapshot(`
          'use strict';

          module.exports = withScope;

          function withScope() {
            return 'Hello from withScope';
          }

        `);
      });

      it("should create test file", async () => {
        const file = await fixture.readWorkspaceFile(
          `packages/${packageName}/__tests__/${packageName}.test.js`
        );
        expect(file).toMatchInlineSnapshot(`
          'use strict';

          const withScope = require('..');
          const assert = require('assert').strict;

          assert.strictEqual(withScope(), 'Hello from withScope');
          console.info('withScope tests passed');

        `);
      });
    });

    describe("--access", () => {
      const packageName = "with-scope-and-access";

      beforeAll(async () => {
        await fixture.lerna(`create @scope/${packageName} -y --access restricted`);
      });

      it("should create README.MD", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
        expect(file).toMatchInlineSnapshot(`
          # \`@scope/with-scope-and-access\`

          > TODO: description

          ## Usage

          \`\`\`
          const withScopeAndAccess = require('@scope/with-scope-and-access');

          // TODO: DEMONSTRATE API
          \`\`\`

        `);
      });

      it("should create package.json", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
        expect(file).toMatchInlineSnapshot(`
          {
            "name": "@scope/with-scope-and-access",
            "version": "0.0.0",
            "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
            "keywords": [],
            "author": "<author>",
            "license": "ISC",
            "main": "lib/with-scope-and-access.js",
            "directories": {
              "lib": "lib",
              "test": "__tests__"
            },
            "files": [
              "lib"
            ],
            "publishConfig": {
              "access": "restricted"
            },
            "repository": {
              "type": "git",
              "url": "<url>/lerna-create/origin.git"
            },
            "scripts": {
              "test": "node ./__tests__/@scope/with-scope-and-access.test.js"
            }
          }

        `);
      });

      it("should create lib file", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
        expect(file).toMatchInlineSnapshot(`
          'use strict';

          module.exports = withScopeAndAccess;

          function withScopeAndAccess() {
            return 'Hello from withScopeAndAccess';
          }

        `);
      });

      it("should create test file", async () => {
        const file = await fixture.readWorkspaceFile(
          `packages/${packageName}/__tests__/${packageName}.test.js`
        );
        expect(file).toMatchInlineSnapshot(`
          'use strict';

          const withScopeAndAccess = require('..');
          const assert = require('assert').strict;

          assert.strictEqual(withScopeAndAccess(), 'Hello from withScopeAndAccess');
          console.info('withScopeAndAccess tests passed');

        `);
      });
    });

    describe("--registry", () => {
      const packageName = "with-scope-and-registry";

      beforeAll(async () => {
        await fixture.lerna(`create @scope/${packageName} -y --registry my-registry.com`);
      });

      it("should create README.MD", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
        expect(file).toMatchInlineSnapshot(`
          # \`@scope/with-scope-and-registry\`

          > TODO: description

          ## Usage

          \`\`\`
          const withScopeAndRegistry = require('@scope/with-scope-and-registry');

          // TODO: DEMONSTRATE API
          \`\`\`

        `);
      });

      it("should create package.json", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
        expect(file).toMatchInlineSnapshot(`
          {
            "name": "@scope/with-scope-and-registry",
            "version": "0.0.0",
            "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
            "keywords": [],
            "author": "<author>",
            "license": "ISC",
            "main": "lib/with-scope-and-registry.js",
            "directories": {
              "lib": "lib",
              "test": "__tests__"
            },
            "files": [
              "lib"
            ],
            "publishConfig": {
              "registry": "my-registry.com"
            },
            "repository": {
              "type": "git",
              "url": "<url>/lerna-create/origin.git"
            },
            "scripts": {
              "test": "node ./__tests__/@scope/with-scope-and-registry.test.js"
            }
          }

        `);
      });

      it("should create lib file", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
        expect(file).toMatchInlineSnapshot(`
          'use strict';

          module.exports = withScopeAndRegistry;

          function withScopeAndRegistry() {
            return 'Hello from withScopeAndRegistry';
          }

        `);
      });

      it("should create test file", async () => {
        const file = await fixture.readWorkspaceFile(
          `packages/${packageName}/__tests__/${packageName}.test.js`
        );
        expect(file).toMatchInlineSnapshot(`
          'use strict';

          const withScopeAndRegistry = require('..');
          const assert = require('assert').strict;

          assert.strictEqual(withScopeAndRegistry(), 'Hello from withScopeAndRegistry');
          console.info('withScopeAndRegistry tests passed');

        `);
      });
    });

    describe("--tag", () => {
      const packageName = "with-scope-and-tag";

      beforeAll(async () => {
        await fixture.lerna(`create @scope/${packageName} -y --tag test-scope-tag`);
      });

      it("should create README.MD", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/README.md`);
        expect(file).toMatchInlineSnapshot(`
          # \`@scope/with-scope-and-tag\`

          > TODO: description

          ## Usage

          \`\`\`
          const withScopeAndTag = require('@scope/with-scope-and-tag');

          // TODO: DEMONSTRATE API
          \`\`\`

        `);
      });

      it("should create package.json", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/package.json`);
        expect(file).toMatchInlineSnapshot(`
          {
            "name": "@scope/with-scope-and-tag",
            "version": "0.0.0",
            "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
            "keywords": [],
            "author": "<author>",
            "license": "ISC",
            "main": "lib/with-scope-and-tag.js",
            "directories": {
              "lib": "lib",
              "test": "__tests__"
            },
            "files": [
              "lib"
            ],
            "publishConfig": {
              "access": "public",
              "tag": "test-scope-tag"
            },
            "repository": {
              "type": "git",
              "url": "<url>/lerna-create/origin.git"
            },
            "scripts": {
              "test": "node ./__tests__/@scope/with-scope-and-tag.test.js"
            }
          }

        `);
      });

      it("should create lib file", async () => {
        const file = await fixture.readWorkspaceFile(`packages/${packageName}/lib/${packageName}.js`);
        expect(file).toMatchInlineSnapshot(`
          'use strict';

          module.exports = withScopeAndTag;

          function withScopeAndTag() {
            return 'Hello from withScopeAndTag';
          }

        `);
      });

      it("should create test file", async () => {
        const file = await fixture.readWorkspaceFile(
          `packages/${packageName}/__tests__/${packageName}.test.js`
        );
        expect(file).toMatchInlineSnapshot(`
          'use strict';

          const withScopeAndTag = require('..');
          const assert = require('assert').strict;

          assert.strictEqual(withScopeAndTag(), 'Hello from withScopeAndTag');
          console.info('withScopeAndTag tests passed');

        `);
      });
    });

    describe("and a location", () => {
      it("one segment long", async () => {
        const packageName = "one-segment";
        await fixture.lerna(`create @scope/${packageName} apps -y`);

        const fileExists = await fixture.workspaceFileExists(`apps/${packageName}/README.md`);
        expect(fileExists).toBe(true);
      });

      it("two segments long", async () => {
        const packageName = "two-segments";
        await fixture.lerna(`create @scope/${packageName} libs/react -y`);

        const fileExists = await fixture.workspaceFileExists(`libs/react/${packageName}/README.md`);
        expect(fileExists).toBe(true);
      });

      it("two segments long with mismatched casing", async () => {
        const packageName = "two-segments-case-sensitivity";
        await fixture.lerna(`create @scope/${packageName} Libs/React -y`);

        const fileExists = await fixture.workspaceFileExists(`libs/react/${packageName}/README.md`);
        expect(fileExists).toBe(true);
      });

      it("two segments long relative path from the root", async () => {
        const packageName = "two-segments-relative";
        await fixture.lerna(`create @scope/${packageName} ./libs/react -y`);

        const fileExists = await fixture.workspaceFileExists(`libs/react/${packageName}/README.md`);
        expect(fileExists).toBe(true);
      });

      it("two segments long absolute path", async () => {
        const packageName = "two-segments-absolute";
        const absolutePath = fixture.getWorkspacePath("libs/react");
        await fixture.lerna(`create @scope/${packageName} ${absolutePath} -y`);

        const fileExists = await fixture.workspaceFileExists(`libs/react/${packageName}/README.md`);
        expect(fileExists).toBe(true);
      });

      describe("throws an error", () => {
        it("when the location does not match a configured workspace directory", async () => {
          const packageName = "invalid-location-with-scope";
          const result = await fixture.lerna(`create @scope/${packageName} invalid-location -y`, {
            silenceError: true,
          });

          expect(result.combinedOutput).toMatchInlineSnapshot(`
            lerna notice cli v999.9.9-e2e.0
            lerna ERR! ENOPKGDIR Location "invalid-location" is not configured as a workspace directory.

          `);
        });
      });
    });

    describe("throws an error", () => {
      it("when the name is invalid and appears to be a path", async () => {
        const packageName = "apps/@scope/invalid-package-name";
        const result = await fixture.lerna(`create ${packageName} -y`, { silenceError: true });

        expect(result.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna ERR! ENOPKGNAME Invalid package name. Use the <loc> positional to specify package directory.
          lerna ERR! ENOPKGNAME See https://github.com/lerna/lerna/tree/main/libs/commands/create#usage for details.

        `);
      });
    });
  });

  describe("throws an error", () => {
    it("when package name appears to be a path", async () => {
      const packageName = "apps/invalid-package-name";
      const result = await fixture.lerna(`create ${packageName} -y`, { silenceError: true });

      expect(result.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna ERR! ENOPKGNAME Invalid package name. Use the <loc> positional to specify package directory.
        lerna ERR! ENOPKGNAME See https://github.com/lerna/lerna/tree/main/libs/commands/create#usage for details.

      `);
    });
  });

  describe("created test script", () => {
    it("should run and succeed", async () => {
      await fixture.lerna("create test-script -y");
      const result = await fixture.lerna("run test --scope=test-script");

      expect(result.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna notice filter including "test-script"
        lerna info filter [ 'test-script' ]

        > test-script:test

        > test-script@0.0.0 test
        > node ./__tests__/test-script.test.js
        testScript tests passed

         

         >  Lerna (powered by Nx)   Successfully ran target test for project test-script



      `);
    });
  });
});
