"use strict";

const client = {
  repos: {
    createRelease: jest.fn(),
  },
};

module.exports.createGitLabClient = () => client;
