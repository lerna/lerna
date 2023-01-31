// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

const releases = new Map();

// keep test data isolated
afterEach(() => {
  releases.clear();
});

const client = {
  repos: {
    createRelease: jest.fn((opts) => {
      releases.set(opts.name, opts);
      return Promise.resolve();
    }),
  },
};

module.exports.createGitHubClient = jest.fn(() => client);
module.exports.createGitHubClient.releases = releases;
module.exports.parseGitRepo = () => ({
  owner: "lerna",
  name: "lerna",
});
