import { Fixture } from "@lerna/e2e-utils";
import { remove } from "fs-extra";

(async () => {
  const fixture = await Fixture.create({
    e2eRoot: process.env.E2E_ROOT,
    name: "lerna-run-nx-include-dependencies-without-nx-json",
    packageManager: "npm",
    initializeGit: true,
    runLernaInit: true,
    installDependencies: true,
  });

  await fixture.lerna("create package-1 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-1",
    scripts: {
      "print-name": "echo test-package-1",
    },
  });
  await fixture.lerna("create package-2 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-2",
    scripts: {
      "print-name": "echo test-package-2",
    },
  });
  await fixture.lerna("create package-3 -y --dependencies package-1 package-2");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-3",
    scripts: {
      "print-name": "echo test-package-3",
    },
  });

  await fixture.updateJson("lerna.json", (json) => ({
    ...json,
    loglevel: "verbose",
  }));

  await fixture.addNxJsonToWorkspace();

  await remove(fixture.getWorkspacePath("nx.json"));

  // Log the fixture's root path so that it can be captured in exec.sh
  console.log((fixture as any).fixtureRootPath);
})();
