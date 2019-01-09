"use strict";

const log = require("libnpm/log");
const Octokit = require("@octokit/rest");

module.exports = function createGitHubClient() {
  log.silly("createGitHubClient");

  const { GH_TOKEN, GHE_API_URL, GHE_VERSION } = process.env;

  if (!GH_TOKEN) {
    throw new Error("A GH_TOKEN environment variable is required.");
  }

  if (GHE_VERSION) {
    // eslint-disable-next-line
    Octokit.plugin(require(`@octokit/plugin-enterprise-rest/ghe-${GHE_VERSION}`));
  }

  const client = new Octokit({
    agent: undefined,
    baseUrl: GHE_API_URL,
  });

  client.authenticate({
    type: "token",
    token: GH_TOKEN,
  });

  return client;
};
