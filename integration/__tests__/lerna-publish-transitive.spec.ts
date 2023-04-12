import {
  changelogSerializer,
  cliRunner,
  cloneFixtureFactory,
  commitChangeToPackage,
  gitTag,
  showCommit,
} from "@lerna/test-helpers";
import path from "path";

const cloneFixture = cloneFixtureFactory(path.resolve(__dirname, "../../libs/commands/publish"));

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(changelogSerializer);

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish updates all transitive dependents", async () => {
  const { cwd } = await cloneFixture("snake-graph");
  const args = ["publish", "major", "--yes"];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  await cliRunner(cwd, env)(...args);

  const patch = await showCommit(cwd);
  expect(patch).toMatchInlineSnapshot(`
v2.0.0

HEAD -> main, tag: v2.0.0, origin/main

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
@@ -4 +4 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
diff --git a/packages/package-2/package.json b/packages/package-2/package.json
index SHA..SHA 100644
--- a/packages/package-2/package.json
+++ b/packages/package-2/package.json
@@ -4 +4 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
@@ -6 +6 @@
-    "package-1": "^1.0.0"
+    "package-1": "^2.0.0"
diff --git a/packages/package-3/package.json b/packages/package-3/package.json
index SHA..SHA 100644
--- a/packages/package-3/package.json
+++ b/packages/package-3/package.json
@@ -4 +4 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
@@ -6 +6 @@
-    "package-2": "^1.0.0"
+    "package-2": "^2.0.0"
diff --git a/packages/package-4/package.json b/packages/package-4/package.json
index SHA..SHA 100644
--- a/packages/package-4/package.json
+++ b/packages/package-4/package.json
@@ -4 +4 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
@@ -6 +6 @@
-    "package-3": "^1.0.0"
+    "package-3": "^2.0.0"
diff --git a/packages/package-5/package.json b/packages/package-5/package.json
index SHA..SHA 100644
--- a/packages/package-5/package.json
+++ b/packages/package-5/package.json
@@ -4 +4 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
@@ -6 +6 @@
-    "package-4": "^1.0.0"
+    "package-4": "^2.0.0"
`);
});
