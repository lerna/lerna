import { Fixture } from "@lerna/e2e-utils";
import { workspaceRoot } from "@nx/devkit";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

interface RecordedRequest {
  method: string;
  url: string;
  otp?: string;
  authType?: string;
  command?: string;
}

/**
 * Verdaccio cannot answer with a two-factor challenge, so this small registry does what the npm registry does for
 * an account secured with a security key: a 401 with an `authUrl` / `doneUrl` pair for each write, a `202` from
 * `doneUrl` while the challenge is pending, then a `200` with the token that the client sends back as `npm-otp`.
 */
async function startFakeRegistry() {
  const requests: RecordedRequest[] = [];
  const polls: Record<string, number> = {};

  const server: Server = createServer((req, res) => {
    const { method = "", url = "" } = req;
    requests.push({
      method,
      url,
      otp: req.headers["npm-otp"] as string | undefined,
      authType: req.headers["npm-auth-type"] as string | undefined,
      command: req.headers["npm-command"] as string | undefined,
    });

    const send = (status: number, body?: unknown, headers: Record<string, string> = {}) => {
      res.writeHead(status, { "content-type": "application/json", ...headers });
      res.end(body === undefined ? undefined : JSON.stringify(body));
    };
    const challenge = (session: string) =>
      send(
        401,
        { authUrl: `${registry}auth/${session}`, doneUrl: `${registry}done/${session}` },
        { "www-authenticate": "OTP" }
      );

    // drain the request body before answering
    req.resume();
    req.on("end", () => {
      const done = url.match(/^\/done\/(.+)$/);
      if (method === "GET" && done) {
        const session = done[1];
        polls[session] = (polls[session] ?? 0) + 1;
        return polls[session] === 1
          ? send(202, {}, { "retry-after": "0.1" })
          : send(200, { token: `${session}-token` });
      }

      if (method === "GET" && url === "/package-1") {
        return send(200, { name: "package-1", "dist-tags": {}, versions: {} });
      }
      if (method === "PUT" && url === "/package-1") {
        return req.headers["npm-otp"] === "publish-token" ? send(200, {}) : challenge("publish");
      }

      if (method === "GET" && url === "/-/package/package-1/dist-tags") {
        return send(200, { "lerna-temp": "1.0.0" });
      }
      if (method === "DELETE" && url === "/-/package/package-1/dist-tags/lerna-temp") {
        return send(204);
      }
      if (method === "PUT" && url === "/-/package/package-1/dist-tags/latest") {
        return req.headers["npm-otp"] === "dist-tag-token" ? send(204) : challenge("dist-tag");
      }

      return send(404, { error: "not found" });
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const registry = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;

  return { server, registry, requests };
}

describe("lerna-publish-web-auth", () => {
  let fixture: Fixture;
  let server: Server;
  let registry: string;
  let requests: RecordedRequest[];

  beforeEach(async () => {
    ({ server, registry, requests } = await startFakeRegistry());

    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-publish-web-auth",
      packageManager: "npm",
      initializeGit: true,
      lernaInit: false,
      installDependencies: false,
    });

    const registryHost = registry.replace(/^http:/, "");
    await writeFile(
      fixture.getWorkspacePath(".npmrc"),
      `registry=${registry}\n${registryHost}:_authToken=fake-token\nbrowser=false\n`
    );
    await writeFile(
      fixture.getWorkspacePath("package.json"),
      JSON.stringify({ name: "root", private: true, workspaces: ["packages/*"] }, null, 2)
    );
    await writeFile(fixture.getWorkspacePath("lerna.json"), JSON.stringify({ version: "1.0.0" }, null, 2));
    await mkdir(fixture.getWorkspacePath("packages/package-1"), { recursive: true });
    await writeFile(
      fixture.getWorkspacePath("packages/package-1/package.json"),
      JSON.stringify({ name: "package-1", version: "1.0.0" }, null, 2)
    );
    await fixture.createInitialGitCommit();

    // Nothing is installed in the fixture, so run the lerna CLI built in this repo. otplease only answers a
    // two-factor challenge on a TTY, so the wrapper pretends to have one before it loads the CLI.
    const cli = pathToFileURL(join(workspaceRoot, "packages/lerna/dist/cli.js")).href;
    await writeFile(
      fixture.getWorkspacePath("../lerna-tty.mjs"),
      [
        "process.stdin.isTTY = true;",
        "process.stdout.isTTY = true;",
        `await import(${JSON.stringify(cli)});`,
      ].join("\n")
    );
  });

  afterEach(async () => {
    await fixture.destroy();
    await new Promise((resolve) => server.close(resolve));
  });

  it("completes the web two-factor challenge for the publish and the dist-tag requests", async () => {
    const output = await fixture.exec(
      `node ../lerna-tty.mjs publish from-package --temp-tag --registry=${registry} --yes`
    );

    expect(output.combinedOutput).toContain(`${registry}auth/publish`);
    expect(output.combinedOutput).toContain(`${registry}auth/dist-tag`);
    expect(output.combinedOutput).toContain("Successfully published:");
    expect(output.combinedOutput).not.toContain("Press ENTER");

    expect(requests.map(({ method, url, otp }) => `${method} ${url}${otp ? ` otp=${otp}` : ""}`))
      .toMatchInlineSnapshot(`
        Array [
          "GET /package-1",
          "PUT /package-1",
          "GET /done/publish",
          "GET /done/publish",
          "PUT /package-1 otp=publish-token",
          "GET /-/package/package-1/dist-tags",
          "DELETE /-/package/package-1/dist-tags/lerna-temp",
          "GET /-/package/package-1/dist-tags",
          "PUT /-/package/package-1/dist-tags/latest",
          "PUT /-/package/package-1/dist-tags/latest otp=publish-token",
          "GET /done/dist-tag",
          "GET /done/dist-tag",
          "PUT /-/package/package-1/dist-tags/latest otp=dist-tag-token",
        ]
      `);
    expect(requests[1]).toEqual(
      expect.objectContaining({ method: "PUT", url: "/package-1", authType: "web", command: "publish" })
    );
  });
});
