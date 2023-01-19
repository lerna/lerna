import { PackageGraphNode } from "../package-graph/package-graph-node";
import { buildGraph } from "./__helpers__/build-graph";
import { collectDependents } from "./collect-dependents";

test("source node (dag)", () => {
  const graph = buildGraph();
  const candidates = new Set<PackageGraphNode>();

  candidates.add(graph.get("package-dag-1"));

  const result = collectDependents(candidates);

  expect(Array.from(result)).toEqual([
    expect.objectContaining({ name: "package-dag-2a" }),
    expect.objectContaining({ name: "package-dag-2b" }),
    expect.objectContaining({ name: "package-dag-3" }),
  ]);
});

test("internal node (dag)", () => {
  const graph = buildGraph();
  const candidates = new Set<PackageGraphNode>();

  candidates.add(graph.get("package-dag-2a"));

  const result = collectDependents(candidates);

  expect(Array.from(result)).toEqual([expect.objectContaining({ name: "package-dag-3" })]);
});

test("pendant node (dag)", () => {
  const graph = buildGraph();
  const candidates = new Set<PackageGraphNode>();

  candidates.add(graph.get("package-standalone"));

  const result = collectDependents(candidates);

  expect(Array.from(result)).toEqual([]);
});

test("source node (cycle)", () => {
  const graph = buildGraph();
  const candidates = new Set<PackageGraphNode>();

  candidates.add(graph.get("package-cycle-1"));

  const result = collectDependents(candidates);

  expect(Array.from(result)).toEqual([
    expect.objectContaining({ name: "package-cycle-2" }),
    expect.objectContaining({ name: "package-cycle-extraneous-1" }),
    expect.objectContaining({ name: "package-cycle-extraneous-2" }),
  ]);
});

test("internal node (cycle)", () => {
  const graph = buildGraph();
  const candidates = new Set<PackageGraphNode>();

  candidates.add(graph.get("package-cycle-2"));

  const result = collectDependents(candidates);

  expect(Array.from(result)).toEqual([
    expect.objectContaining({ name: "package-cycle-1" }),
    expect.objectContaining({ name: "package-cycle-extraneous-2" }),
    // package-cycle-extraneous-1 was ignored
  ]);
});
