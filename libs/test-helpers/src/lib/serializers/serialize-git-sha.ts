// expect.addSnapshotSerializer(require("./serialize-git-sha"));

export const gitSHASerializer = {
  serialize: (str: string) => {
    return (
      str
        // canary versions embed the short SHA in a "sha-"-prefixed prerelease identifier
        .replace(/\.sha-[0-9a-f]+\b/g, ".sha-SHA")
        // short SHA tends to be in the path diff comparisons
        .replace(/\b[0-9a-f]{7,8}\b/g, "SHA")
        // full SHA corresponds to gitHead property in package.json files
        .replace(/\b[0-9a-f]{40}\b/g, "GIT_HEAD")
    );
  },
  test: (val: unknown) => {
    return val != null && typeof val === "string" && /[0-9a-f]{7,40}/.test(val);
  },
};
