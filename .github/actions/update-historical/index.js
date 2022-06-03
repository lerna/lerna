// @ts-check
const core = require("@actions/core");
const github = require("@actions/github");

async function main() {
  const token = core.getInput("github-token", { required: true });

  const context = github.context;
  const octokit = github.getOctokit(token, {
    previews: ["ant-man-preview", "flash-preview"],
  });

  const allOpenIssues = [];

  for await (const issuePage of octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    ...context.repo,
    state: "open",
  })) {
    for (const issueOrPr of issuePage.data) {
      if (issueOrPr.pull_request) {
        continue;
      }
      allOpenIssues.push(issueOrPr);
    }
  }

  const staleButHeavilyUpvoted = [];

  const openIssuesUpdatedWithinTheLastYear = allOpenIssues.filter((issue) => {
    const updatedAt = new Date(issue.updated_at);
    const isUpdatedWithinLastYear =
      (updatedAt.getFullYear() === 2021 && updatedAt.getMonth() > 5) || updatedAt.getFullYear() === 2022;

    if (!isUpdatedWithinLastYear && issue.reactions["+1"] >= 10) {
      staleButHeavilyUpvoted.push(issue);
    }

    return isUpdatedWithinLastYear;
  });

  console.log({
    countStaleButHeavilyUpvoted: staleButHeavilyUpvoted.length,
    countOpenIssuesUpdatedWithinTheLastYear: openIssuesUpdatedWithinTheLastYear.length,
  });

  console.log({ staleButHeavilyUpvoted: JSON.stringify(staleButHeavilyUpvoted) });
}

main();
