"use strict";

const writeJsonFile = require("write-json-file");
const loadJsonFile = require("load-json-file");
const path = require("path");

const cliRunner = require("@lerna-test/cli-runner");
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitTag = require("@lerna-test/git-tag");
const showCommit = require("@lerna-test/show-commit");
const cloneFixture = require("@lerna-test/clone-fixture")(
  path.resolve(__dirname, "../commands/publish/__tests__")
);

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(require("@lerna-test/serialize-changelog"));

async function commitChangeToPackage(cwd, packageName, commitMsg, data) {
  const packageJSONPath = path.join(cwd, "packages", packageName, "package.json");
  const pkg = await loadJsonFile(packageJSONPath);

  await writeJsonFile(packageJSONPath, Object.assign(pkg, data));
  await gitAdd(cwd, packageJSONPath);

  return gitCommit(cwd, commitMsg);
}

const env = {
  // never actually upload when calling `npm install`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish replaces file: specifier with local version before npm publish", async () => {
  const { cwd } = await cloneFixture("relative-file-specs");

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "feat(package-1): changed", { changed: true });

  await cliRunner(cwd, env)("publish", "major", "--yes", "--no-verify-registry");

  const patch = await showCommit(cwd);
  expect(patch).toMatchInlineSnapshot(`
v2.0.0

HEAD -> master, tag: v2.0.0, origin/master

diff --git a/lerna.json b/lerna.json
index SHA..SHA 100644
--- a/lerna.json
+++ b/lerna.json
@@ -2 +2 @@
-  "version": "1.0.0"
+  "version": "2.0.0"
diff --git a/packages/package-1/package.json b/packages/package-1/package.json
index SHA..SHA 100644
--- a/packages/package-1/package.json
+++ b/packages/package-1/package.json
@@ -3 +3 @@
-	"version": "1.0.0",
+	"version": "2.0.0",
diff --git a/packages/package-2/package.json b/packages/package-2/package.json
index SHA..SHA 100644
--- a/packages/package-2/package.json
+++ b/packages/package-2/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
diff --git a/packages/package-3/package.json b/packages/package-3/package.json
index SHA..SHA 100644
--- a/packages/package-3/package.json
+++ b/packages/package-3/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
diff --git a/packages/package-4/package.json b/packages/package-4/package.json
index SHA..SHA 100644
--- a/packages/package-4/package.json
+++ b/packages/package-4/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
diff --git a/packages/package-5/package.json b/packages/package-5/package.json
index SHA..SHA 100644
--- a/packages/package-5/package.json
+++ b/packages/package-5/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
diff --git a/packages/package-6/package.json b/packages/package-6/package.json
index SHA..SHA 100644
--- a/packages/package-6/package.json
+++ b/packages/package-6/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
diff --git a/packages/package-7/package.json b/packages/package-7/package.json
index SHA..SHA 100644
--- a/packages/package-7/package.json
+++ b/packages/package-7/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
`);
});
