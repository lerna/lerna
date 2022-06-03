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

  const issuesToUpdate = [];
  const staleButHeavilyUpvoted = [];

  for (const issue of allOpenIssues) {
    const updatedAt = new Date(issue.updated_at);
    // Updated in Jun 2021 or later
    const isUpdatedWithinLastYear =
      (updatedAt.getFullYear() === 2021 && updatedAt.getMonth() >= 5) || updatedAt.getFullYear() === 2022;

    if (!isUpdatedWithinLastYear) {
      if (issue.reactions["+1"] >= 10) {
        staleButHeavilyUpvoted.push(issue);
      } else {
        // Not updated within the last AND not upvoted more than 10 times ever
        // issuesToUpdate.push(issue);
      }
    }

    // TMP: Focus on test issue
    if (issue.number === 3149) {
      issuesToUpdate.push(issue);
    }
  }

  console.log({
    countStaleButHeavilyUpvoted: staleButHeavilyUpvoted.length,
    countIssuesToUpdate: issuesToUpdate.length,
    firstIssueToUpdate: issuesToUpdate[0],
  });

  console.log("staleButHeavilyUpvoted:\n");
  staleButHeavilyUpvoted.forEach((issue) => console.log(`${issue.html_url}`));
}

main();
