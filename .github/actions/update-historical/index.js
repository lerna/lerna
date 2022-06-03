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

  console.log({
    count: allOpenIssues.length,
    countWithReactions: allOpenIssues.filter((issue) => issue.reactions.total_count > 0).length,
    countWith10PlusUpvotes: allOpenIssues.filter((issue) => issue.reactions["+1"] >= 10).length,
    countCreatedBefore2021WithFewerThan10Upvotes: allOpenIssues.filter((issue) => {
      const createdAt = new Date(issue.created_at);
      return createdAt.getFullYear() < 2021 && issue.reactions["+1"] < 10;
    }).length,
    countLastUpdatedBefore2021WithFewerThan10Upvotes: allOpenIssues.filter((issue) => {
      const updatedAt = new Date(issue.updated_at);
      return updatedAt.getFullYear() < 2021 && issue.reactions["+1"] < 10;
    }).length,
    countLastUpdatedBefore2020WithFewerThan10Upvotes: allOpenIssues.filter((issue) => {
      const updatedAt = new Date(issue.updated_at);
      return updatedAt.getFullYear() < 2020 && issue.reactions["+1"] < 10;
    }).length,
    countLastUpdatedBefore2020: allOpenIssues.filter((issue) => {
      const updatedAt = new Date(issue.updated_at);
      return updatedAt.getFullYear() < 2020;
    }).length,
    countLastUpdatedBefore2021: allOpenIssues.filter((issue) => {
      const updatedAt = new Date(issue.updated_at);
      return updatedAt.getFullYear() < 2021;
    }).length,
    countLastUpdatedWithinTheLastYear: allOpenIssues.filter((issue) => {
      const updatedAt = new Date(issue.updated_at);
      return updatedAt.getFullYear() >= 2021 && updatedAt.getMonth() > 5;
    }).length,
  });
}

main();
