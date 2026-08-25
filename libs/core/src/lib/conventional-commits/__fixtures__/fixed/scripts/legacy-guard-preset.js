"use strict";

const parserOpts = require("./parser-opts");
const whatBump = require("./what-bump");

// Simulates a new v8+ preset that also ships the legacy writer guard, i.e. a
// string mainTemplate which throws when rendered by a pre-v9 writer
module.exports = function createPreset() {
  return {
    parser: parserOpts,
    writer: {
      mainTemplate: "{{[this preset requires conventional-changelog-writer@9 or newer] true}}",
      template: (context) =>
        [
          `<a name="${context.version}"></a>`,
          `## <small>${context.version} (${context.date})</small>`,
          ...context.commitGroups.flatMap((group) => group.commits.map((commit) => `* ${commit.header}`)),
          "",
        ].join("\n"),
      groupBy: `type`,
    },
    commits: { merges: false },
    whatBump,
  };
};
