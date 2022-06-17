// @ts-check
const core = require("@actions/core");
const github = require("@actions/github");

async function main() {
  const token = core.getInput("github-token", { required: true });

  const context = github.context;
  const octokit = github.getOctokit(token, {
    previews: ["ant-man-preview", "flash-preview"],
  });

  const allStaleIssues = [];
  const staleIssuesWithAnyUpdatesSinceLabelling = [];
  const staleIssuesToBeClosed = [];
  const STALE_LABEL_NAME = "stale";
  const AUTOMATED_LABELLING_DATETIME = new Date("2022-06-03 19:23 GMT+4");

  for await (const issuePage of octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    ...context.repo,
    state: "open",
  })) {
    for (const issueOrPr of issuePage.data) {
      if (issueOrPr.pull_request) {
        continue;
      }
      const hasStaleLabel = issueOrPr.labels.some((label) => {
        if (typeof label === "string") {
          return label === STALE_LABEL_NAME;
        }
        return label.name === STALE_LABEL_NAME;
      });
      if (hasStaleLabel) {
        allStaleIssues.push(issueOrPr);
      }
    }
  }

  for (const issue of allStaleIssues) {
    // const updatedAt = new Date(issue.updated_at);

    // if (updatedAt.getTime() > AUTOMATED_LABELLING_DATETIME.getTime()) {
    //   staleIssuesWithAnyUpdatesSinceLabelling.push(issue);
    // } else {
    //   staleIssuesToBeClosed.push(issue);
    // }

    if (issue.number === 3189) {
      staleIssuesToBeClosed.push(issue);
    }
  }

  console.log({
    allStaleIssues: allStaleIssues.length,
    allStaleIssuesWithUpdatesSinceLabelling: staleIssuesWithAnyUpdatesSinceLabelling.length,
    staleIssuesToBeClosed: staleIssuesToBeClosed.length,
  });

  console.log(JSON.stringify(staleIssuesToBeClosed, null, 2));
}

main();
