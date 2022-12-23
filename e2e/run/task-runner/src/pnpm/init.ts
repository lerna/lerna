import { Fixture } from "@lerna/e2e-utils";

(async () => {
  const fixture = await Fixture.create({
    e2eRoot: process.env.E2E_ROOT,
    name: "lerna-run",
    packageManager: "pnpm",
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
      "print-name": "echo test-package-4",
    },
  });

  await fixture.lerna("create package-4a -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-4a",
    scripts: {
      "print-name": "echo test-package-4a",
    },
  });

  await fixture.lerna("create package-4b -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-4b",
    scripts: {
      "print-name": "echo test-package-4b",
    },
  });

  await fixture.lerna("create package-5 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-5",
    scripts: {
      "print-name": "echo test-package-5",
    },
  });

  await fixture.lerna("create package-6 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-6",
    scripts: {
      "print-name": "echo test-package-6",
    },
  });

  await fixture.lerna("create package-7 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-7",
    scripts: {
      "print-name": "echo test-package-7",
    },
  });

  await fixture.lerna("create package-8 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-8",
    scripts: {
      "print-name": "echo test-package-8",
    },
  });

  await fixture.lerna("create package-9 -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-9",
    scripts: {
      "print-name": "echo test-package-9",
    },
  });

  await fixture.lerna("create package-app -y");
  await fixture.addScriptsToPackage({
    packagePath: "packages/package-app",
    scripts: {
      "print-name": "echo test-package-app",
    },
  });

  await fixture.createInitialGitCommit();
  await fixture.exec("git push --set-upstream origin test-main");
  await fixture.lerna("version 1.0.0 -y");

  await fixture.addDependencyToPackage({
    packagePath: "packages/package-app",
    dependencyName: "package-1",
    version: "^1.0.0",
  });
  await fixture.addDependencyToPackage({
    packagePath: "packages/package-app",
    dependencyName: "package-2",
    version: "~1.0.0",
  });
  await fixture.addDependencyToPackage({
    packagePath: "packages/package-app",
    dependencyName: "package-3",
    version: "1.0.0",
  });
  await fixture.addDependencyToPackage({
    packagePath: "packages/package-app",
    dependencyName: "package-4",
    version: "workspace:^1.0.0",
  });
  await fixture.addDependencyToPackage({
    packagePath: "packages/package-4",
    dependencyName: "package-4a",
    version: "workspace:^1.0.0",
  });
  await fixture.addDependencyToPackage({
    packagePath: "packages/package-4",
    dependencyName: "package-4b",
    version: "workspace:*",
  });
  await fixture.addDependencyToPackage({
    packagePath: "packages/package-app",
    dependencyName: "package-5",
    version: "workspace:~1.0.0",
  });
  await fixture.addDependencyToPackage({
    packagePath: "packages/package-app",
    dependencyName: "package-6",
    version: "workspace:1.0.0",
  });
  await fixture.addDependencyToPackage({
    packagePath: "packages/package-app",
    dependencyName: "package-7",
    version: "workspace:*",
  });
  await fixture.addDependencyToPackage({
    packagePath: "packages/package-app",
    dependencyName: "package-8",
    version: "workspace:^",
  });
  await fixture.addDependencyToPackage({
    packagePath: "packages/package-app",
    dependencyName: "package-9",
    version: "workspace:~",
  });

  // Log the fixture's root path so that it can be captured in exec.sh
  console.log((fixture as any).fixtureRootPath);
})();
