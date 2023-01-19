import { Octokit } from "@octokit/rest";
import { createGitHubClient, parseGitRepo } from "./create-github-client";

jest.mock("@octokit/rest");
jest.mock("@lerna/child-process");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

childProcess.execSync.mockReturnValue("5.6.0");

describe("createGitHubClient", () => {
  beforeEach(() => {
    process.env = {};
  });

  afterEach(() => {
    process.env = {};
  });

  it("errors if no GH_TOKEN env var", () => {
    expect(() => {
      createGitHubClient();
    }).toThrow("A GH_TOKEN environment variable is required.");
  });

  it("doesnt error if GH_TOKEN env var is set", () => {
    process.env.GH_TOKEN = "TOKEN";

    expect(() => {
      createGitHubClient();
    }).not.toThrow();
  });

  it("initializes GHE plugin when GHE_VERSION env var is set", () => {
    process.env.GH_TOKEN = "TOKEN";
    process.env.GHE_VERSION = "2.18";

    createGitHubClient();

    expect(Octokit.plugin).toHaveBeenCalledWith(expect.anything());
  });

  it("sets octokit `baseUrl` when GHE_API_URL is set", () => {
    process.env.GH_TOKEN = "TOKEN";
    process.env.GHE_API_URL = "http://some/host";

    createGitHubClient();

    expect(Octokit).toHaveBeenCalledWith({
      auth: "token TOKEN",
      baseUrl: "http://some/host",
    });
  });
});

describe("parseGitRepo", () => {
  it("returns a parsed URL", () => {
    childProcess.execSync.mockReturnValue("git@github.com:org/lerna.git");

    const repo = parseGitRepo();

    expect(childProcess.execSync).toHaveBeenCalledWith(
      "git",
      ["config", "--get", "remote.origin.url"],
      undefined
    );

    expect(repo).toEqual(
      expect.objectContaining({
        name: "lerna",
        owner: "org",
      })
    );
  });

  it("can change the origin", () => {
    childProcess.execSync.mockReturnValue("git@github.com:org/lerna.git");

    parseGitRepo("upstream");

    expect(childProcess.execSync).toHaveBeenCalledWith(
      "git",
      ["config", "--get", "remote.upstream.url"],
      undefined
    );
  });

  it("throws an error if no URL returned", () => {
    childProcess.execSync.mockReturnValue("");

    expect(() => parseGitRepo()).toThrow('Git remote URL could not be found using "origin".');
  });
});
