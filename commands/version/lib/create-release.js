"use strict";

const semver = require("semver");

const createGitLabClient = require("@lerna/gitlab-client");
const { createGitHubClient, parseGitRepo } = require("@lerna/github-client");
const ValidationError = require("@lerna/validation-error");

module.exports = createRelease;

function createClient(type) {
  switch (type) {
    case "gitlab":
      return createGitLabClient();
    case "github":
      return createGitHubClient();
    default:
      throw new ValidationError("ERELEASE", "Invalid release client type");
  }
}

function createRelease(type, { tags, releaseNotes }, { gitRemote, execOpts }) {
  const repo = parseGitRepo(gitRemote, execOpts);
  const client = createClient(type);

  return Promise.all(
    releaseNotes.map(({ notes, name }) => {
      const tag = name === "fixed" ? tags[0] : tags.find(t => t.startsWith(`${name}@`));

      /* istanbul ignore if */
      if (!tag) {
        return Promise.resolve();
      }

      const prereleaseParts = semver.prerelease(tag.replace(`${name}@`, "")) || [];

      return client.repos.createRelease({
        owner: repo.owner,
        repo: repo.name,
        tag_name: tag,
        name: tag,
        body: notes,
        draft: false,
        prerelease: prereleaseParts.length > 0,
      });
    })
  );
}
