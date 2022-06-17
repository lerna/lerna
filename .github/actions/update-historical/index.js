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
    const updatedAt = new Date(issue.updated_at);

    if (updatedAt.getTime() > AUTOMATED_LABELLING_DATETIME.getTime()) {
      staleIssuesWithAnyUpdatesSinceLabelling.push(issue);
    } else {
      staleIssuesToBeClosed.push(issue);
    }

    // if (issue.number === 3189) {
    //   staleIssuesToBeClosed.push(issue);
    // }
  }

  console.log({
    allStaleIssues: allStaleIssues.length,
    allStaleIssuesWithUpdatesSinceLabelling: staleIssuesWithAnyUpdatesSinceLabelling.length,
    staleIssuesToBeClosed: staleIssuesToBeClosed.length,
  });

  // console.log(JSON.stringify(staleIssuesToBeClosed, null, 2));

  //   for (const isseToBeClosed of staleIssuesToBeClosed) {
  //     await octokit.rest.issues.createComment({
  //       ...context.repo,
  //       issue_number: isseToBeClosed.number,
  //       body: `Hi Folks 👋

  // You will have seen in our message above that we at Nrwl are working really hard to bring the lerna repo up to date with what matters most to its community in June 2022.

  // As previously stated in that message, because we have not heard from the original author of this issue within the last 14 days, we are now automatically closing it.

  // **If any users, including the original author, are still impacted by this issue then we still want to hear from you!**

  // All we ask is that you first update to the latest lerna (\`5.1.4\` at the time of writing) to make sure it is still reproducible, and then fill out one of our new issue templates, providing all the requested details which apply to your situation:

  // https://github.com/lerna/lerna/issues/new/choose

  // Many thanks again! 🙏

  // ---

  // P.S. Over and above getting to grips with the repo, we have also been hard at work launching a new website, resolving all vulnerabilities, merging exciting new features and reigniting community PR contributions! 🚀

  // You can read our recent blog post to learn more about what we've been up to:
  // https://blog.nrwl.io/lerna-5-1-new-website-new-guides-new-lerna-example-repo-distributed-caching-support-and-speed-64d66410bec7
  // `,
  //     });

  //     await octokit.rest.issues.update({
  //       ...context.repo,
  //       issue_number: isseToBeClosed.number,
  //       state: "closed",
  //     });
  //     await octokit.rest.issues.lock({
  //       ...context.repo,
  //       issue_number: isseToBeClosed.number,
  //     });
  //   }
}

main();
