"use strict";

const parserOpts = require("./parser-opts");
const whatBump = require("./what-bump");

// Simulates a new v8+ preset that also ships the legacy writer guard:
// a string mainTemplate which only renders on a pre-v9 writer
module.exports = function createPreset() {
  return {
    parser: parserOpts,
    writer: {
      mainTemplate: "{{[this preset requires conventional-changelog-writer@9 or newer] true}}",
      template: (context) => {
        const commits = context.commitGroups.flatMap((group) => group.commits);

        return [
          context.headerPartial(context),
          ...commits.map((commit) => context.commitPartial(context, commit)),
          "",
        ].join("\n");
      },
      headerPartial: (context) =>
        `<a name="${context.version}"></a>\n## <small>${context.version} (${context.date})</small>`,
      commitPartial: (context, commit) => `* ${commit.header}`,
      groupBy: `type`,
    },
    commits: { merges: false },
    whatBump,
  };
};
