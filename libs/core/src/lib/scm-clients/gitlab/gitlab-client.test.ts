import _fetch from "node-fetch";
import { GitLabClient } from "./gitlab-client";

jest.mock("node-fetch");

const fetch = jest.mocked(_fetch);

describe("GitLabClient", () => {
  describe("constructor", () => {
    it("sets `baseUrl` and `token`", () => {
      const client = new GitLabClient("TOKEN", "http://some/host");

      expect(client.baseUrl).toEqual("http://some/host");
      expect(client.token).toEqual("TOKEN");
    });
  });

  describe("releasesUrl", () => {
    it("returns a GitLab releases API URL", () => {
      const client = new GitLabClient("TOKEN", "http://some/host");
      const url = client.releasesUrl("the-namespace", "the-project");

      expect(url).toEqual("http://some/host/projects/the-namespace%2Fthe-project/releases");
    });
  });

  describe("createRelease", () => {
    it("requests releases api with release", () => {
      const client = new GitLabClient("TOKEN", "http://some/host");
      fetch.mockResolvedValue({ ok: true } as any);
      const release = {
        owner: "the-owner",
        repo: "the-repo",
        name: "the-name",
        tag_name: "the-tag_name",
        body: "the-body",
      };

      client.createRelease(release);

      expect(fetch).toHaveBeenCalledWith("http://some/host/projects/the-owner%2Fthe-repo/releases", {
        method: "post",
        body: JSON.stringify({
          name: "the-name",
          tag_name: "the-tag_name",
          description: "the-body",
        }),
        headers: {
          "PRIVATE-TOKEN": "TOKEN",
          "Content-Type": "application/json",
        },
      });
    });
  });
});
