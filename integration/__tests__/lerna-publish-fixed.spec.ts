import { changelogSerializer, cliRunner, cloneFixtureFactory, showCommit } from "@lerna/test-helpers";
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

test("lerna publish updates fixed versions", async () => {
  const { cwd } = await cloneFixture("normal");
  const args = ["publish", "patch", "--yes"];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 1.0.0 => 1.0.1
 - package-2: 1.0.0 => 1.0.1
 - package-3: 1.0.0 => 1.0.1
 - package-4: 1.0.0 => 1.0.1
 - package-5: 1.0.0 => 1.0.1 (private)

Successfully published:
 - package-1@1.0.1
 - package-2@1.0.1
 - package-3@1.0.1
 - package-4@1.0.1
`);

  const patch = await showCommit(cwd);
  expect(patch).toMatchInlineSnapshot(`
v1.0.1

HEAD -> main, tag: v1.0.1, origin/main

diff --git a/lerna.json b/lerna.json
index SHA..SHA 100644
--- a/lerna.json
+++ b/lerna.json
@@ -2 +2 @@
-  "version": "1.0.0",
+  "version": "1.0.1",
diff --git a/packages/package-1/package.json b/packages/package-1/package.json
index SHA..SHA 100644
--- a/packages/package-1/package.json
+++ b/packages/package-1/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "1.0.1",
diff --git a/packages/package-2/package.json b/packages/package-2/package.json
index SHA..SHA 100644
--- a/packages/package-2/package.json
+++ b/packages/package-2/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "1.0.1",
@@ -5 +5 @@
-    "package-1": "^1.0.0"
+    "package-1": "^1.0.1"
diff --git a/packages/package-3/package.json b/packages/package-3/package.json
index SHA..SHA 100644
--- a/packages/package-3/package.json
+++ b/packages/package-3/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "1.0.1",
@@ -8 +8 @@
-    "package-2": "^1.0.0"
+    "package-2": "^1.0.1"
diff --git a/packages/package-4/package.json b/packages/package-4/package.json
index SHA..SHA 100644
--- a/packages/package-4/package.json
+++ b/packages/package-4/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "1.0.1",
diff --git a/packages/package-5/package.json b/packages/package-5/package.json
index SHA..SHA 100644
--- a/packages/package-5/package.json
+++ b/packages/package-5/package.json
@@ -4 +4 @@
-    "package-1": "^1.0.0"
+    "package-1": "^1.0.1"
@@ -7 +7 @@
-    "package-3": "^1.0.0"
+    "package-3": "^1.0.1"
@@ -10 +10 @@
-  "version": "1.0.0",
+  "version": "1.0.1",
`);
});
