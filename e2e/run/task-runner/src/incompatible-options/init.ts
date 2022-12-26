import { Fixture } from "@lerna/e2e-utils";

(async () => {
  const fixture = await Fixture.create({
    e2eRoot: process.env.E2E_ROOT,
    name: "lerna-run-nx-incompatible-options",
    packageManager: "npm",
    initializeGit: true,
    runLernaInit: true,
    installDependencies: true,
  });

  await fixture.addNxJsonToWorkspace();
  await fixture.updateJson("nx.json", (json) => ({
    ...json,
    targetDefaults: {
      "print-name": {
        dependsOn: ["^print-name"],
      },
    },
  }));

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
  await fixture.lerna("create package-3 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-3",
    scripts: {
      "print-name": "echo test-package-3",
    },
  });

  // Log the fixture's root path so that it can be captured in exec.sh
  console.log((fixture as any).fixtureRootPath);
})();
