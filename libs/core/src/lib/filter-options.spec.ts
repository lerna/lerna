/* eslint-disable @nrwl/nx/enforce-module-boundaries */
// nx-ignore-next-line
import { initFixtureFactory } from "@lerna/test-helpers";
import path from "path";
import yargs from "yargs/yargs";
import { collectUpdates as _collectUpdates } from "./collect-updates";
import { filterOptions, getFilteredPackages } from "./filter-options";
import { PackageGraph } from "./package-graph";
import { getPackages } from "./project";

jest.mock("./collect-updates");

// The mocks extend the original module, so we need to extend the type for this file
const collectUpdates = _collectUpdates as typeof _collectUpdates & {
  setUpdated: (updated: string, ...names: string[]) => void;
};

const initFixture = initFixtureFactory(path.resolve(__dirname, "../../"));

async function buildGraph(cwd: string) {
  const packages = await getPackages(cwd);
  return new PackageGraph(packages);
}

function parseOptions(...args: string[]) {
  return filterOptions(yargs().exitProcess(false).showHelpOnFail(false)).parse(args);
}

// working dir is never mutated
let cwd: string;

beforeAll(async () => {
  cwd = await initFixture("filtering");
});

test.each`
  flag
  ${"--scope"}
  ${"--ignore"}
`("$flag requires an argument", async ({ flag }) => {
  // swallow stderr during yargs execution
  jest.spyOn(console, "error").mockImplementation(() => {});

  expect(() => parseOptions(flag)).toThrow("Not enough arguments");
});

test.each`
  argv                                                      | matched
  ${["--scope", "package-3"]}                               | ${[3]}
  ${["--scope", "package-@(1|2)"]}                          | ${[1, 2]}
  ${["--scope", "package-{3,4}"]}                           | ${[3, 4]}
  ${["--ignore", "package-3"]}                              | ${[1, 2, 4, 5]}
  ${["--ignore", "package-@(2|3|4)"]}                       | ${[1, 5]}
  ${["--ignore", "package-{1,2,5}"]}                        | ${[3, 4]}
  ${["--scope", "package-1", "--scope", "*-2"]}             | ${[1, 2]}
  ${["--scope", "package-@(1|2)", "--ignore", "package-2"]} | ${[1]}
  ${["--ignore", "package-{1,2}", "--ignore", "package-3"]} | ${[4, 5]}
`("filters $argv", async ({ argv, matched }) => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions(...argv) as any;

  const result = await getFilteredPackages(packageGraph, execOpts, options);
  expect(result.map((node) => node.name)).toEqual(matched.map((n: string) => `package-${n}`));
});

test.each`
  argv
  ${["--scope", "not-a-package"]}
  ${["--ignore", "package-*"]}
  ${["--scope", "package-@(1|2)", "--ignore", "package-{1,2}"]}
`("errors $argv", async ({ argv }) => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions(...argv) as any;

  await expect(getFilteredPackages(packageGraph, execOpts, options)).rejects.toThrow(
    "No packages remain after filtering"
  );
});

test.each`
  argv
  ${["--scope", "not-a-package", "--continue-if-no-match"]}
  ${["--ignore", "package-*", "--continue-if-no-match"]}
  ${["--scope", "package-@(1|2)", "--ignore", "package-{1,2}", "--continue-if-no-match"]}
`("no errors and no packages $argv", async ({ argv }) => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions(...argv) as any;

  const result = await getFilteredPackages(packageGraph, execOpts, options);
  expect(result).toHaveLength(0);
});

test("--since returns all packages if no tag is found", async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since") as any;

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result).toHaveLength(5);
  expect(collectUpdates).toHaveBeenLastCalledWith(
    expect.any(Array),
    packageGraph,
    execOpts,
    expect.objectContaining({ since: "" })
  );
});

test("--since returns packages updated since the last tag", async () => {
  collectUpdates.setUpdated(cwd, "package-2", "package-3");

  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since") as any;

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((node) => node.name)).toEqual(["package-2", "package-3"]);
});

test("--since <ref> should return packages updated since <ref>", async () => {
  collectUpdates.setUpdated(cwd, "package-1", "package-2", "package-3");

  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since", "deadbeef") as any;

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((node) => node.name)).toEqual(["package-1", "package-2", "package-3"]);
  expect(collectUpdates).toHaveBeenLastCalledWith(
    expect.any(Array),
    packageGraph,
    execOpts,
    expect.objectContaining({ since: "deadbeef" })
  );
});

test("--scope package-{2,3,4} --since main", async () => {
  collectUpdates.setUpdated(cwd, "package-4", "package-1");

  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-{2,3,4}", "--since", "main") as any;

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((node) => node.name)).toEqual(["package-4"]);
  expect(collectUpdates).toHaveBeenLastCalledWith(
    // filter-packages before collect-updates
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    [2, 3, 4].map((n) => packageGraph.get(`package-${n}`).pkg),
    packageGraph,
    execOpts,
    expect.objectContaining({ since: "main" })
  );
});

test("--exclude-dependents", async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since", "foo", "--exclude-dependents") as any;

  await getFilteredPackages(packageGraph, execOpts, options);

  expect(collectUpdates).toHaveBeenLastCalledWith(
    expect.any(Array),
    packageGraph,
    execOpts,
    expect.objectContaining({ excludeDependents: true })
  );
});

test("--exclude-dependents conflicts with --include-dependents", async () => {
  expect(() => parseOptions("--exclude-dependents", "--include-dependents")).toThrow(
    /(exclude|include)-dependents/
  );
});

test("--include-dependents", async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-1", "--include-dependents") as any;

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((pkg) => pkg.name)).toEqual(["package-1", "package-2", "package-5", "package-3"]);
  expect(collectUpdates).not.toHaveBeenCalled();
});

test("--include-dependencies", async () => {
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-3", "--include-dependencies") as any;

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map((pkg) => pkg.name)).toEqual(["package-3", "package-2", "package-1"]);
  expect(collectUpdates).not.toHaveBeenCalled();
});
