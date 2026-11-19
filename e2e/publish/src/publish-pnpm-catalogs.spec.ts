import { Fixture } from "@lerna/e2e-utils";
import { writeJsonFile } from "@nx/devkit";
import { appendFile } from "fs-extra";

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomVersion = () => `${randomInt(10, 89)}.${randomInt(10, 89)}.${randomInt(10, 89)}`;

describe("lerna-publish-pnpm-catalogs", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-publish-pnpm-catalogs",
      packageManager: "pnpm",
      initializeGit: true,
      lernaInit: { args: [`--packages="packages/*"`] },
      installDependencies: true,
    });
  });
  afterEach(() => fixture.destroy());

  describe("from-git", () => {
    it("should publish to the remote registry, replacing catalog: specs with the catalog version ranges", async () => {
      await fixture.lerna("create test-catalog-main -y");

      await appendFile(
        fixture.getWorkspacePath("pnpm-workspace.yaml"),
        "\ncatalog:\n  ms: ^2.1.3\n\ncatalogs:\n  numbers:\n    is-number: ^7.0.0\n"
      );
      await fixture.updateJson(`packages/test-catalog-main/package.json`, (json) => ({
        ...json,
        dependencies: {
          ...(json.dependencies as Record<string, string>),
          ms: "catalog:",
          "is-number": "catalog:numbers",
        },
      }));
      await fixture.install();

      const version = randomVersion();
      await fixture.createInitialGitCommit();
      await fixture.exec("git push origin test-main");

      await fixture.lerna(`version ${version} -y`);

      // lerna version keeps the catalog: specs
      expect(
        JSON.parse(await fixture.readWorkspaceFile("packages/test-catalog-main/package.json"))
      ).toMatchObject({
        version,
        dependencies: {
          ms: "catalog:",
          "is-number": "catalog:numbers",
        },
      });

      const output = await fixture.lerna(
        "publish from-git --registry=http://localhost:4873 -y --concurrency 1"
      );
      expect(output.combinedOutput).toContain("lerna success published 1 package");

      // the working tree is reset to the catalog: specs after publishing
      expect(
        JSON.parse(await fixture.readWorkspaceFile("packages/test-catalog-main/package.json"))
      ).toMatchObject({
        dependencies: {
          ms: "catalog:",
          "is-number": "catalog:numbers",
        },
      });

      // Avoid npm reading the pnpm-only settings in the workspace .npmrc.
      const npmOpts = { cwd: fixture.getWorkspacePath("..") };

      const publishedDependencies = await fixture.exec(
        `npm view test-catalog-main@${version} dependencies --json --registry=http://localhost:4873`,
        npmOpts
      );
      expect(JSON.parse(publishedDependencies.stdout)).toEqual({
        ms: "^2.1.3",
        "is-number": "^7.0.0",
      });

      await fixture.exec("mkdir test-install-published-packages", npmOpts);
      writeJsonFile(fixture.getWorkspacePath("../test-install-published-packages/package.json"), {
        name: "test-install-published-packages",
        dependencies: {
          "test-catalog-main": version,
        },
      });

      // ensure that the published package can be installed
      // this verifies the validity of the updated package.json file that was published by `lerna publish`
      await fixture.exec(
        "npm --prefix ./test-install-published-packages install --registry=http://localhost:4873",
        npmOpts
      );

      await fixture.exec(
        `npm unpublish --force test-catalog-main@${version} --registry=http://localhost:4873`,
        npmOpts
      );
    });
  });
});
