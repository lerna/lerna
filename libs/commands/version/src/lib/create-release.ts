import { createGitHubClient, createGitLabClient, parseGitRepo, ValidationError } from "@lerna/core";
import semver from "semver";

module.exports.createRelease = createRelease;
module.exports.createReleaseClient = createReleaseClient;

/**
 * @param {'github' | 'gitlab'} type
 */
function createReleaseClient(type) {
  switch (type) {
    case "gitlab":
      return createGitLabClient();
    case "github":
      return createGitHubClient();
    /* istanbul ignore next: guarded by yargs.choices() */
    default:
      throw new ValidationError("ERELEASE", "Invalid release client type");
  }
}

/**
 * @param {ReturnType<typeof createReleaseClient>} client
 * @param {{ tags: string[]; releaseNotes: { name: string; notes: string; }[] }} commandProps
 * @param {{ gitRemote: string; execOpts: import("@lerna/child-process").ExecOpts }} opts
 */
function createRelease(client, { tags, releaseNotes }, { gitRemote, execOpts }) {
  const repo = parseGitRepo(gitRemote, execOpts);

  return Promise.all(
    releaseNotes.map(({ notes, name }) => {
      const tag = name === "fixed" ? tags[0] : tags.find((t) => t.startsWith(`${name}@`));

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
