// @ts-check
const core = require("@actions/core");
const github = require("@actions/github");

async function main() {
  const token = core.getInput("github-token", { required: true });

  const context = github.context;
  const octokit = github.getOctokit(token, {
    previews: ["ant-man-preview", "flash-preview"],
  });

  let count = 0;

  for await (const issuePage of octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    ...context.repo,
    state: "open",
  })) {
    if (count === 0) {
      console.log({ data: JSON.stringify(issuePage.data, null, 2) });
    }
    count++;
  }

  console.log({ count });
}

main();
