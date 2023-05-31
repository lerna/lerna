import { readJson, Tree, writeJson } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import updateOptionsFromLegacyDeprecateConfig from "./update-options-from-legacy-deprecate-config";

describe("update-options-from-legacy-deprecate-config", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it.each(getTestCases())(
    `should appropriately migrate outdated lerna.json config CASE %#`,
    async ({ beforeMigration, expectedAfterMigration }) => {
      writeJson(tree, "lerna.json", beforeMigration);
      await updateOptionsFromLegacyDeprecateConfig(tree);
      expect(readJson(tree, "lerna.json")).toEqual(expectedAfterMigration);
    }
  );
});

// Using a function at the bottom just to help make the file more readable, given the large size of test cases
function getTestCases() {
  return [
    {
      beforeMigration: {
        commands: {
          add: {
            someProp: true,
          },
          bootstrap: {
            someNestedProp: {
              someProp: true,
            },
          },
        },
      },
      expectedAfterMigration: {
        command: {
          add: {
            someProp: true,
          },
          bootstrap: {
            someNestedProp: {
              someProp: true,
            },
          },
        },
      },
    },
    {
      // Merge insane mixed configs, preferring the already correctly named config
      beforeMigration: {
        command: {
          add: {
            someProp: false,
          },
          bootstrap: {
            someNestedProp: {
              someProp: false,
            },
          },
        },
        commands: {
          add: {
            someProp: true,
          },
          bootstrap: {
            someNestedProp: {
              someProp: true,
            },
          },
        },
      },
      expectedAfterMigration: {
        command: {
          add: {
            someProp: false,
          },
          bootstrap: {
            someNestedProp: {
              someProp: false,
            },
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          add: {
            includeFilteredDependencies: true,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          add: {
            includeDependencies: true,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          add: {
            includeFilteredDependents: false,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          add: {
            includeDependents: false,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          bootstrap: {
            includeFilteredDependencies: true,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          bootstrap: {
            includeDependencies: true,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          bootstrap: {
            includeFilteredDependents: false,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          bootstrap: {
            includeDependents: false,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          clean: {
            includeFilteredDependencies: true,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          clean: {
            includeDependencies: true,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          clean: {
            includeFilteredDependents: false,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          clean: {
            includeDependents: false,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          exec: {
            includeFilteredDependencies: true,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          exec: {
            includeDependencies: true,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          exec: {
            includeFilteredDependents: false,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          exec: {
            includeDependents: false,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          list: {
            includeFilteredDependencies: true,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          list: {
            includeDependencies: true,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          list: {
            includeFilteredDependents: false,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          list: {
            includeDependents: false,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          run: {
            includeFilteredDependencies: true,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          run: {
            includeDependencies: true,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          run: {
            includeFilteredDependents: false,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          run: {
            includeDependents: false,
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          version: {
            githubRelease: true,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          version: {
            createRelease: "github",
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          version: {
            githubRelease: false,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          version: {},
        },
      },
    },
    {
      beforeMigration: {
        command: {
          publish: {
            githubRelease: true,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          publish: {
            createRelease: "github",
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          publish: {
            githubRelease: false,
          },
        },
      },
      expectedAfterMigration: {
        command: {
          publish: {},
        },
      },
    },
    {
      beforeMigration: {
        command: {
          version: {
            npmTag: "next",
            cdVersion: "prerelease",
            ignore: ["ignored-file"],
          },
        },
      },
      expectedAfterMigration: {
        command: {
          version: {
            distTag: "next",
            bump: "prerelease",
            ignoreChanges: ["ignored-file"],
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          publish: {
            npmTag: "next",
            cdVersion: "prerelease",
            ignore: ["ignored-file"],
          },
        },
      },
      expectedAfterMigration: {
        command: {
          publish: {
            distTag: "next",
            bump: "prerelease",
            ignoreChanges: ["ignored-file"],
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          version: {
            skipGit: true,
            repoVersion: "prerelease",
          },
        },
      },
      expectedAfterMigration: {
        command: {
          version: {
            push: false,
            gitTagVersion: false,
            bump: "prerelease",
          },
        },
      },
    },
    {
      beforeMigration: {
        command: {
          publish: {
            skipGit: true,
            repoVersion: "prerelease",
          },
        },
      },
      expectedAfterMigration: {
        command: {
          publish: {
            push: false,
            gitTagVersion: false,
            bump: "prerelease",
          },
        },
      },
    },
  ];
}
