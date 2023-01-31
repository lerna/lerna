import fetch from "node-fetch";
import log from "npmlog";
import path from "path";

export class GitLabClient {
  constructor(public token: string, public baseUrl = "https://gitlab.com/api/v4") {}

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  createRelease({ owner, repo, name, tag_name: tagName, body }) {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const releasesUrl = this.releasesUrl(owner, repo, "releases");

    log.silly("Requesting GitLab releases", releasesUrl);

    return fetch(releasesUrl, {
      method: "post",
      body: JSON.stringify({ name, tag_name: tagName, description: body }),
      headers: {
        "PRIVATE-TOKEN": this.token,
        "Content-Type": "application/json",
      },
    }).then(({ ok, status, statusText }) => {
      if (!ok) {
        log.error("gitlab", `Failed to create release\nRequest returned ${status} ${statusText}`);
      } else {
        log.silly("gitlab", "Created release successfully.");
      }
    });
  }

  releasesUrl(namespace: string, project: string) {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new URL(
      `${this.baseUrl}/${path.join("projects", encodeURIComponent(`${namespace}/${project}`), "releases")}`
    ).toString();
  }
}
