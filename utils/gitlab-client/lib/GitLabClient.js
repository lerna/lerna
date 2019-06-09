"use strict";

const path = require("path");

const { URL } = require("whatwg-url");
const log = require("npmlog");
const fetch = require("node-fetch");

class GitLabClient {
  constructor(baseUrl = "https://gitlab.com/api/v4", token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  createRelease({ owner, repo, name, tag_name: tagName, body }) {
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

  releasesUrl(namespace, project) {
    return new URL(
      `${this.baseUrl}/${path.join("projects", encodeURIComponent(`${namespace}/${project}`), "releases")}`
    ).toString();
  }
}

module.exports = GitLabClient;
