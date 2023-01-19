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

module.exports.createGitLabClient = jest.fn(() => client);
module.exports.createGitLabClient.releases = releases;
