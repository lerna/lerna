import execa from "execa";
import normalizeNewline from "normalize-newline";
import initFixture from "../helpers/initFixture";
import loadPkgManifests from "../helpers/loadPkgManifests";
import { LERNA_BIN } from "../helpers/constants";

const lastCommitMessage = (cwd) =>
  execa.stdout("git", ["log", "-1", "--format=%B"], { cwd }).then(normalizeNewline);

describe("lerna publish", () => {
  test.concurrent("updates fixed versions", () => {
    return initFixture("PublishCommand/normal").then((cwd) => {
      const args = [
        "publish",
        "--skip-npm",
        "--cd-version=patch",
        "--yes",
      ];

      return execa(LERNA_BIN, args, { cwd }).then((result) => {
        expect(result.stdout).toMatchSnapshot("stdout: updates fixed versions");

        return Promise.all([
          loadPkgManifests(cwd),
          lastCommitMessage(cwd),
        ]);
      }).then(([allPackageJsons, commitMessage]) => {
        expect(allPackageJsons).toMatchSnapshot("packages: updates fixed versions");
        expect(commitMessage).toMatchSnapshot("commit: updates fixed versions");
      });
    });
  });

  test.concurrent("updates independent versions", () => {
    return initFixture("PublishCommand/independent").then((cwd) => {
      const args = [
        "publish",
        "--skip-npm",
        "--cd-version=major",
        "--yes",
      ];

      return execa(LERNA_BIN, args, { cwd }).then((result) => {
        expect(result.stdout).toMatchSnapshot("stdout: updates independent versions");

        return Promise.all([
          loadPkgManifests(cwd),
          lastCommitMessage(cwd),
        ]);
      }).then(([allPackageJsons, commitMessage]) => {
        expect(allPackageJsons).toMatchSnapshot("packages: updates independent versions");
        expect(commitMessage).toMatchSnapshot("commit: updates independent versions");
      });
    });
  });
});
