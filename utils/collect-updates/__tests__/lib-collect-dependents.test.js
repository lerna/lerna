"use strict";

// helpers
const buildGraph = require("../__helpers__/build-graph");

// file under test
const collectDependents = require("../lib/collect-dependents");

test("source node (dag)", () => {
  const graph = buildGraph();
  const candidates = new Set();

  candidates.add(graph.get("package-dag-1"));

  const result = collectDependents(candidates);

  expect(Array.from(result)).toEqual([
    expect.objectContaining({ name: "package-dag-2a" }),
    expect.objectContaining({ name: "package-dag-3" }),
    expect.objectContaining({ name: "package-dag-2b" }),
  ]);
});

test("internal node (dag)", () => {
  const graph = buildGraph();
  const candidates = new Set();

  candidates.add(graph.get("package-dag-2a"));

  const result = collectDependents(candidates);

  expect(Array.from(result)).toEqual([expect.objectContaining({ name: "package-dag-3" })]);
});

test("pendant node (dag)", () => {
  const graph = buildGraph();
  const candidates = new Set();

  candidates.add(graph.get("package-standalone"));

  const result = collectDependents(candidates);

  expect(Array.from(result)).toEqual([]);
});

test("source node (cycle)", () => {
  const graph = buildGraph();
  const candidates = new Set();

  candidates.add(graph.get("package-cycle-1"));

  const result = collectDependents(candidates);

  expect(Array.from(result)).toEqual([
    expect.objectContaining({ name: "package-cycle-2" }),
    expect.objectContaining({ name: "package-cycle-extraneous" }),
  ]);
});

test("internal node (cycle)", () => {
  const graph = buildGraph();
  const candidates = new Set();

  candidates.add(graph.get("package-cycle-2"));

  const result = collectDependents(candidates);

  expect(Array.from(result)).toEqual([expect.objectContaining({ name: "package-cycle-1" })]);
});
