"use strict";

const log = require("npmlog");

const GitLabClient = require("./lib/GitLabClient");

module.exports = createGitLabClient;

function OcktokitAdapter(client) {
  return { repos: { createRelease: client.createRelease.bind(client) } };
}

function createGitLabClient() {
  const { GL_API_URL, GL_TOKEN } = process.env;

  log.silly("Creating a GitLab client...");

  if (!GL_TOKEN) {
    throw new Error("A GL_TOKEN environment variable is required.");
  }

  const client = new GitLabClient(GL_API_URL, GL_TOKEN);

  return OcktokitAdapter(client);
}
