import { changelogSerializer, cliRunner, cloneFixtureFactory, showCommit } from "@lerna/test-helpers";
import path from "path";

const cloneFixture = cloneFixtureFactory(path.resolve(__dirname, "../commands/publish/__tests__"));

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(changelogSerializer);

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish applies build metadata to fixed versions", async () => {
  const { cwd } = await cloneFixture("normal");
  const args = ["publish", "patch", "--yes", "--build-metadata", "001"];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

    Changes:
     - package-1: 1.0.0 => 1.0.1+001
     - package-2: 1.0.0 => 1.0.1+001
     - package-3: 1.0.0 => 1.0.1+001
     - package-4: 1.0.0 => 1.0.1+001
     - package-5: 1.0.0 => 1.0.1+001 (private)

    Successfully published:
     - package-1@1.0.1+001
     - package-2@1.0.1+001
     - package-3@1.0.1+001
     - package-4@1.0.1+001
  `);

  const patch = await showCommit(cwd);
  expect(patch).toMatchInlineSnapshot(`
    v1.0.1+001

    HEAD -> main, tag: v1.0.1+001, origin/main

    diff --git a/lerna.json b/lerna.json
    index SHA..SHA 100644
    --- a/lerna.json
    +++ b/lerna.json
    @@ -2 +2 @@
    -  "version": "1.0.0",
    +  "version": "1.0.1+001",
    diff --git a/packages/package-1/package.json b/packages/package-1/package.json
    index SHA..SHA 100644
    --- a/packages/package-1/package.json
    +++ b/packages/package-1/package.json
    @@ -3 +3 @@
    -  "version": "1.0.0",
    +  "version": "1.0.1+001",
    diff --git a/packages/package-2/package.json b/packages/package-2/package.json
    index SHA..SHA 100644
    --- a/packages/package-2/package.json
    +++ b/packages/package-2/package.json
    @@ -3 +3 @@
    -  "version": "1.0.0",
    +  "version": "1.0.1+001",
    @@ -5 +5 @@
    -    "package-1": "^1.0.0"
    +    "package-1": "^1.0.1+001"
    diff --git a/packages/package-3/package.json b/packages/package-3/package.json
    index SHA..SHA 100644
    --- a/packages/package-3/package.json
    +++ b/packages/package-3/package.json
    @@ -3 +3 @@
    -  "version": "1.0.0",
    +  "version": "1.0.1+001",
    @@ -8 +8 @@
    -    "package-2": "^1.0.0"
    +    "package-2": "^1.0.1+001"
    diff --git a/packages/package-4/package.json b/packages/package-4/package.json
    index SHA..SHA 100644
    --- a/packages/package-4/package.json
    +++ b/packages/package-4/package.json
    @@ -3 +3 @@
    -  "version": "1.0.0",
    +  "version": "1.0.1+001",
    diff --git a/packages/package-5/package.json b/packages/package-5/package.json
    index SHA..SHA 100644
    --- a/packages/package-5/package.json
    +++ b/packages/package-5/package.json
    @@ -4 +4 @@
    -    "package-1": "^1.0.0"
    +    "package-1": "^1.0.1+001"
    @@ -7 +7 @@
    -    "package-3": "^1.0.0"
    +    "package-3": "^1.0.1+001"
    @@ -10 +10 @@
    -  "version": "1.0.0",
    +  "version": "1.0.1+001",
  `);
});

test("lerna publish updates build metadata to fixed versions", async () => {
  const { cwd } = await cloneFixture("build-metadata");
  const args = ["publish", "patch", "--yes", "--build-metadata", "002"];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

    Changes:
     - package-1: 1.0.0+001 => 1.0.1+002

    Successfully published:
     - package-1@1.0.1+002
  `);

  const patch = await showCommit(cwd);
  expect(patch).toMatchInlineSnapshot(`
    v1.0.1+002

    HEAD -> main, tag: v1.0.1+002, origin/main

    diff --git a/lerna.json b/lerna.json
    index SHA..SHA 100644
    --- a/lerna.json
    +++ b/lerna.json
    @@ -2 +2 @@
    -  "version": "1.0.0+001"
    +  "version": "1.0.1+002"
    diff --git a/packages/package-1/package.json b/packages/package-1/package.json
    index SHA..SHA 100644
    --- a/packages/package-1/package.json
    +++ b/packages/package-1/package.json
    @@ -3 +3 @@
    -  "version": "1.0.0+001"
    +  "version": "1.0.1+002"
  `);
});

test("lerna publish applies build metadata independent versions", async () => {
  const { cwd } = await cloneFixture("independent");
  const args = ["publish", "major", "--yes", "--build-metadata", "001"];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

    Changes:
     - package-1: 1.0.0 => 2.0.0+001
     - package-2: 2.0.0 => 3.0.0+001
     - package-3: 3.0.0 => 4.0.0+001
     - package-4: 4.0.0 => 5.0.0+001
     - package-5: 5.0.0 => 6.0.0+001 (private)

    Successfully published:
     - package-1@2.0.0+001
     - package-2@3.0.0+001
     - package-3@4.0.0+001
     - package-4@5.0.0+001
  `);

  /* eslint-disable max-len */
  const patch = await showCommit(cwd);
  expect(patch).toMatchInlineSnapshot(`
    Publish

     - package-1@2.0.0+001
     - package-2@3.0.0+001
     - package-3@4.0.0+001
     - package-4@5.0.0+001
     - package-5@6.0.0+001

    HEAD -> main, tag: package-5@6.0.0+001, tag: package-4@5.0.0+001, tag: package-3@4.0.0+001, tag: package-2@3.0.0+001, tag: package-1@2.0.0+001, origin/main

    diff --git a/packages/package-1/package.json b/packages/package-1/package.json
    index SHA..SHA 100644
    --- a/packages/package-1/package.json
    +++ b/packages/package-1/package.json
    @@ -3 +3 @@
    -  "version": "1.0.0",
    +  "version": "2.0.0+001",
    diff --git a/packages/package-2/package.json b/packages/package-2/package.json
    index SHA..SHA 100644
    --- a/packages/package-2/package.json
    +++ b/packages/package-2/package.json
    @@ -3 +3 @@
    -  "version": "2.0.0",
    +  "version": "3.0.0+001",
    @@ -5 +5 @@
    -    "package-1": "^1.0.0"
    +    "package-1": "^2.0.0+001"
    diff --git a/packages/package-3/package.json b/packages/package-3/package.json
    index SHA..SHA 100644
    --- a/packages/package-3/package.json
    +++ b/packages/package-3/package.json
    @@ -3 +3 @@
    -  "version": "3.0.0",
    +  "version": "4.0.0+001",
    @@ -5 +5 @@
    -    "package-2": "^2.0.0"
    +    "package-2": "^3.0.0+001"
    diff --git a/packages/package-4/package.json b/packages/package-4/package.json
    index SHA..SHA 100644
    --- a/packages/package-4/package.json
    +++ b/packages/package-4/package.json
    @@ -3 +3 @@
    -  "version": "4.0.0",
    +  "version": "5.0.0+001",
    diff --git a/packages/package-5/package.json b/packages/package-5/package.json
    index SHA..SHA 100644
    --- a/packages/package-5/package.json
    +++ b/packages/package-5/package.json
    @@ -4 +4 @@
    -    "package-3": "^3.0.0"
    +    "package-3": "^4.0.0+001"
    @@ -7 +7 @@
    -  "version": "5.0.0",
    +  "version": "6.0.0+001",
  `);
});

test("lerna publish updates build metadata to independent versions", async () => {
  const { cwd } = await cloneFixture("independent-build-metadata");
  const args = ["publish", "patch", "--yes", "--build-metadata", "002"];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

    Changes:
     - package-1: 1.0.0+001 => 1.0.1+002
     - package-2: 2.0.0+001 => 2.0.1+002

    Successfully published:
     - package-1@1.0.1+002
     - package-2@2.0.1+002
  `);

  const patch = await showCommit(cwd);
  expect(patch).toMatchInlineSnapshot(`
    Publish

     - package-1@1.0.1+002
     - package-2@2.0.1+002

    HEAD -> main, tag: package-2@2.0.1+002, tag: package-1@1.0.1+002, origin/main

    diff --git a/packages/package-1/package.json b/packages/package-1/package.json
    index SHA..SHA 100644
    --- a/packages/package-1/package.json
    +++ b/packages/package-1/package.json
    @@ -3 +3 @@
    -  "version": "1.0.0+001"
    +  "version": "1.0.1+002"
    diff --git a/packages/package-2/package.json b/packages/package-2/package.json
    index SHA..SHA 100644
    --- a/packages/package-2/package.json
    +++ b/packages/package-2/package.json
    @@ -3 +3 @@
    -  "version": "2.0.0+001"
    +  "version": "2.0.1+002"
  `);
});
