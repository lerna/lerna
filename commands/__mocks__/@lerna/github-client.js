"use strict";

const client = {
  repos: {
    createRelease: jest.fn(),
  },
};

module.exports.client = client;
module.exports.createGitHubClient = () => client;
module.exports.parseGitRepo = () => ({
  owner: "lerna",
  name: "lerna",
});
