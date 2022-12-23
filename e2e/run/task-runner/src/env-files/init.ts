import { Fixture } from "@lerna/e2e-utils";
import { writeFile } from "fs-extra";

(async () => {
  const fixture = await Fixture.create({
    e2eRoot: process.env.E2E_ROOT,
    name: "lerna-run-nx-env-files",
    packageManager: "npm",
    initializeGit: true,
    runLernaInit: true,
    installDependencies: true,
  });

  await writeFile(fixture.getWorkspacePath(".env"), `SOMETHING_IN_ENV_FILE=some_value_here`, "utf-8");

  await fixture.lerna("create package-1 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-1",
    scripts: {
      "log-env-var": "echo $SOMETHING_IN_ENV_FILE",
    },
  });

  await fixture.addNxJsonToWorkspace();

  /**
   * We have to reset this environment variable for these specs because of the fact that we are executing the tests themselves using Nx,
   * and by default it will have already been initialized to true.
   */
  delete process.env.NX_LOAD_DOT_ENV_FILES;

  // Log the fixture's root path so that it can be captured in exec.sh
  console.log((fixture as any).fixtureRootPath);
})();
