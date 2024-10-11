import { createGitHubClient, createGitLabClient, parseGitRepo, ValidationError } from "@lerna/core";
import { ExecOptions } from "child_process";
import semver from "semver";

export type ReleaseClientType = "gitlab" | "github";

export function truncateReleaseBody(body: string, type?: ReleaseClientType) {
  let maxReleaseBodyLength: number | undefined;

  switch (type) {
    case "gitlab":
      maxReleaseBodyLength = 1000000;
      break;
    case "github":
      maxReleaseBodyLength = 125000;
      break;
    default:
      return body;
  }

  if (body.length > maxReleaseBodyLength) {
    const ellipsis = "...";
    return body.slice(0, maxReleaseBodyLength - ellipsis.length) + ellipsis;
  }
  return body;
}

export function createReleaseClient(type?: ReleaseClientType) {
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

export function createRelease(
  client: ReturnType<typeof createReleaseClient>,
  {
    type,
    tags,
    releaseNotes,
    tagVersionSeparator,
  }: {
    type?: ReleaseClientType;
    tags: string[];
    tagVersionSeparator: string;
    releaseNotes: { name: string; notes: string }[];
  },
  { gitRemote, execOpts }: { gitRemote: string; execOpts: ExecOptions }
) {
  const repo = parseGitRepo(gitRemote, execOpts);

  return Promise.all(
    releaseNotes.map(({ notes, name }) => {
      const tag =
        name === "fixed" ? tags[0] : tags.find((t) => t.startsWith(`${name}${tagVersionSeparator}`));

      /* istanbul ignore if */
      if (!tag) {
        return Promise.resolve();
      }

      const prereleaseParts = semver.prerelease(tag.replace(`${name}${tagVersionSeparator}`, "")) || [];

      const body = truncateReleaseBody(notes, type);

      return client.repos.createRelease({
        owner: repo.owner,
        repo: repo.name,
        tag_name: tag,
        name: tag,
        body,
        draft: false,
        prerelease: prereleaseParts.length > 0,
      });
    })
  );
}
