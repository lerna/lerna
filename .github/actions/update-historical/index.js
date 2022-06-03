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

  for (const issueToUpdate of issuesToUpdate) {
    const issueAuthor = issueToUpdate.user.login;

    if (issueToUpdate.number !== 3149) {
      continue;
    }

    await octokit.rest.issues.addLabels({
      ...context.repo,
      issue_number: issueToUpdate.number,
      labels: ["stale"],
    });

    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: issueToUpdate.number,
      body: `Hi Folks 👋 

You may or may not know that lerna is now under the stewardship of Nrwl (announcement here https://github.com/lerna/lerna/issues/3121), a company with a long history of not just producing valuable open-source software (OSS), but also backing others (at the time of writing, Nrwl has donated over $50,000 to OSS it _hasn't_ created, see https://opencollective.com/nx for full details).

Quite simply, Nrwl ❤️  OSS, and is committed to making lerna the best it can be. We use it ourselves.

In order to take this awesome project forward from its current state, it is important that we focus our finite resources on what is most important to lerna users in 2022.

With that in mind, we have identified this issue as being potentially stale due to its age and/or lack of recent activity.

---

**Next steps:**

We want to give you some time to read through this comment and take action per one of the steps outlined below, so for the **next 14 days** we will not make any further updates to this issue.

@${issueAuthor} as the original author of this issue, we are looking to you to update us on the latest state of this as it relates to the **latest version of lerna.**

Please choose one of the steps below, depending on what type of issue this is:

- A) If this issue relates to a potential **BUG** in the latest version of lerna:

  - Please head over to https://github.com/lerna/repro, fork the repo and apply the changes necessary to reproduce the bug. Then open a PR to that https://github.com/lerna/repro repo and comment back to this thread with the PR number so that we can take a look into the problem and provide a fix.

- B) If this issue is a **FEATURE** request to be added to the latest version of lerna:

  - Simply comment back on this thread so that we know you still want us to consider the request for the latest version of lerna.

- C) If this issue is a **QUESTION** which is applicable to latest version of lerna:

  - Please convert the issue to be a Discussion instead: https://github.com/lerna/lerna/discussions

- D) If this issue is no longer applicable to the latest version of lerna:

  - Please close the issue.

---

**If we do not hear from @${issueAuthor} on this thread within the next 14 days, we will automatically close this issue.**

If you are another user impacted by this issue but it ends up being closed as part of this process, we still want to hear from you! Please simply head over to our new issue templates and fill out all the requested details on the template which applies to your situation:

https://github.com/lerna/lerna/issues/new/choose

Thank you all for being a part of this awesome community, we could not be more excited to help move things forward from here 🙏  🚀 
`,
    });
  }

  console.log("staleButHeavilyUpvoted:\n");
  staleButHeavilyUpvoted.forEach((issue) => console.log(`${issue.html_url}`));
}

main();
