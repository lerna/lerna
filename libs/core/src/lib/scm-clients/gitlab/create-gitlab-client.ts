import log from "npmlog";
import { GitLabClient } from "./gitlab-client";

function OcktokitAdapter(client: GitLabClient) {
  return { repos: { createRelease: client.createRelease.bind(client) } };
}

export function createGitLabClient() {
  const { GL_API_URL, GL_TOKEN } = process.env;

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("Creating a GitLab client...");

  if (!GL_TOKEN) {
    throw new Error("A GL_TOKEN environment variable is required.");
  }

  const client = new GitLabClient(GL_TOKEN, GL_API_URL);

  return OcktokitAdapter(client);
}
