"use strict";

// helpers
const buildGraph = require("../__helpers__/build-graph");

// file under test
const collectPackages = require("../lib/collect-packages");

const toNamesList = collection => Array.from(collection).map(pkg => pkg.name);

test("returns all packages", () => {
  const graph = buildGraph();
  const result = collectPackages(graph);

  expect(toNamesList(result)).toMatchInlineSnapshot(`
Array [
  "package-cycle-1",
  "package-cycle-2",
  "package-cycle-extraneous",
  "package-dag-1",
  "package-dag-2a",
  "package-dag-2b",
  "package-dag-3",
  "package-standalone",
]
`);
});

test("filters packages through isCandidate, passing node and name", () => {
  const graph = buildGraph();
  const packagesToInclude = ["package-cycle-1"];
  const isCandidate = (node, name) => {
    return packagesToInclude.includes(node.name) && node.name === name;
  };
  const result = collectPackages(graph, { isCandidate });

  expect(toNamesList(result)).toMatchInlineSnapshot(`
Array [
  "package-cycle-1",
  "package-cycle-2",
  "package-cycle-extraneous",
]
`);
});

test("calls onInclude with included package name", () => {
  const graph = buildGraph();
  const packagesToInclude = ["package-standalone"];
  const isCandidate = (node, name) => packagesToInclude.includes(name);
  const onInclude = jest.fn();
  collectPackages(graph, { isCandidate, onInclude });

  expect(onInclude).toHaveBeenCalledWith(packagesToInclude[0]);
});
