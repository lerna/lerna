"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");
const Octokit = require("@octokit/rest");
const parseGitUrl = require("git-url-parse");

exports.createGitHubClient = createGitHubClient;
exports.parseGitRepo = parseGitRepo;

function createGitHubClient() {
  log.silly("createGitHubClient");

  const { GH_TOKEN, GHE_API_URL, GHE_VERSION } = process.env;
  const options = {};

  if (!GH_TOKEN) {
    throw new Error("A GH_TOKEN environment variable is required.");
  }

  if (GHE_VERSION) {
    // eslint-disable-next-line
    Octokit.plugin(require(`@octokit/plugin-enterprise-rest/ghe-${GHE_VERSION}`));
  }

  if (GHE_API_URL) {
    options.baseUrl = GHE_API_URL;
  }

  const client = new Octokit(options);

  client.authenticate({
    type: "token",
    token: GH_TOKEN,
  });

  return client;
}

function parseGitRepo(remote = "origin", opts) {
  log.silly("parseGitRepo");

  const args = ["config", "--get", `remote.${remote}.url`];

  log.verbose("git", args);

  const url = childProcess.execSync("git", args, opts);

  if (!url) {
    throw new Error(`Git remote URL could not be found using "${remote}".`);
  }

  return parseGitUrl(url);
}
