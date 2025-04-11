import { Octokit } from "@octokit/rest";
import parseGitUrl from "git-url-parse";
import log from "../../npmlog";
import { ValidationError } from "../../validation-error";

const childProcess = require("@lerna/child-process");

export function createGitHubClient(): Octokit {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("createGitHubClient");

  const { GH_TOKEN, GHE_API_URL, GHE_VERSION } = process.env;

  if (!GH_TOKEN) {
    throw new ValidationError(
      "",
      `A GH_TOKEN environment variable is required when "createRelease" is set to "github"`
    );
  }

  if (GHE_VERSION) {
    Octokit.plugin(require(`@octokit/plugin-enterprise-rest/ghe-${GHE_VERSION}`));
  }

  const options = {
    auth: `token ${GH_TOKEN}`,
  };

  if (GHE_API_URL) {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    options.baseUrl = GHE_API_URL;
  }

  return new Octokit(options);
}

export function parseGitRepo(remote = "origin", opts?: any) {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("parseGitRepo");

  const args = ["config", "--get", `remote.${remote}.url`];

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.verbose("git", args);

  const url = childProcess.execSync("git", args, opts);

  if (!url) {
    throw new ValidationError("", `Git remote URL could not be found using "${remote}".`);
  }

  return parseGitUrl(url);
}
