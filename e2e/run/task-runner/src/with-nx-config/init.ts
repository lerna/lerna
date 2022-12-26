import { Fixture } from "@lerna/e2e-utils";

(async () => {
  const fixture = await Fixture.create({
    e2eRoot: process.env.E2E_ROOT,
    name: "lerna-run-with-nx-config",
    packageManager: "npm",
    initializeGit: true,
    runLernaInit: true,
    installDependencies: true,
  });

  await fixture.addNxJsonToWorkspace();

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
  await fixture.lerna("create package-4 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-4",
    scripts: {
      "print:name": "echo test-package-4",
      "print-name-run-one-only": "echo test-package-4-run-one-only",
      "print:name:run-one-only": "echo test-package-4-run-one-only-with-colon",
    },
  });
  await fixture.lerna("create package-5 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-5",
    scripts: {
      "print:name": "echo test-package-5",
    },
  });

  // Log the fixture's root path so that it can be captured in exec.sh
  console.log((fixture as any).fixtureRootPath);
})();
