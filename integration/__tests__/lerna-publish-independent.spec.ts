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

test("lerna publish updates independent versions", async () => {
  const { cwd } = await cloneFixture("independent");
  const args = ["publish", "major", "--yes"];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 1.0.0 => 2.0.0
 - package-2: 2.0.0 => 3.0.0
 - package-3: 3.0.0 => 4.0.0
 - package-4: 4.0.0 => 5.0.0
 - package-5: 5.0.0 => 6.0.0 (private)

Successfully published:
 - package-1@2.0.0
 - package-2@3.0.0
 - package-3@4.0.0
 - package-4@5.0.0
`);

  /* eslint-disable max-len */
  const patch = await showCommit(cwd);
  expect(patch).toMatchInlineSnapshot(`
Publish

 - package-1@2.0.0
 - package-2@3.0.0
 - package-3@4.0.0
 - package-4@5.0.0
 - package-5@6.0.0

HEAD -> main, tag: package-5@6.0.0, tag: package-4@5.0.0, tag: package-3@4.0.0, tag: package-2@3.0.0, tag: package-1@2.0.0, origin/main

diff --git a/packages/package-1/package.json b/packages/package-1/package.json
index SHA..SHA 100644
--- a/packages/package-1/package.json
+++ b/packages/package-1/package.json
@@ -3 +3 @@
-  "version": "1.0.0",
+  "version": "2.0.0",
diff --git a/packages/package-2/package.json b/packages/package-2/package.json
index SHA..SHA 100644
--- a/packages/package-2/package.json
+++ b/packages/package-2/package.json
@@ -3 +3 @@
-  "version": "2.0.0",
+  "version": "3.0.0",
@@ -5 +5 @@
-    "package-1": "^1.0.0"
+    "package-1": "^2.0.0"
diff --git a/packages/package-3/package.json b/packages/package-3/package.json
index SHA..SHA 100644
--- a/packages/package-3/package.json
+++ b/packages/package-3/package.json
@@ -3 +3 @@
-  "version": "3.0.0",
+  "version": "4.0.0",
@@ -5 +5 @@
-    "package-2": "^2.0.0"
+    "package-2": "^3.0.0"
diff --git a/packages/package-4/package.json b/packages/package-4/package.json
index SHA..SHA 100644
--- a/packages/package-4/package.json
+++ b/packages/package-4/package.json
@@ -3 +3 @@
-  "version": "4.0.0",
+  "version": "5.0.0",
diff --git a/packages/package-5/package.json b/packages/package-5/package.json
index SHA..SHA 100644
--- a/packages/package-5/package.json
+++ b/packages/package-5/package.json
@@ -4 +4 @@
-    "package-3": "^3.0.0"
+    "package-3": "^4.0.0"
@@ -7 +7 @@
-  "version": "5.0.0",
+  "version": "6.0.0",
`);
});
