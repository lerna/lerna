import yargs from "yargs/yargs";
import { listableOptions } from "./listable-options";

describe("listableOptions", () => {
  const parsed = (...args: string[]) => listableOptions(yargs()).parse(args.join(" "));

  it("provides --json", () => {
    expect(parsed("--json")).toHaveProperty("json", true);
  });

  it("provides --ndjson", () => {
    expect(parsed("--ndjson")).toHaveProperty("ndjson", true);
  });

  it("provides --all", () => {
    expect(parsed("--all")).toHaveProperty("all", true);
  });

  it("provides --all alias -a", () => {
    expect(parsed("-a")).toHaveProperty("all", true);
  });

  it("provides --long", () => {
    expect(parsed("--long")).toHaveProperty("long", true);
  });

  it("provides --long alias -l", () => {
    expect(parsed("-l")).toHaveProperty("long", true);
  });

  it("provides --parseable", () => {
    expect(parsed("--parseable")).toHaveProperty("parseable", true);
  });

  it("provides --parseable alias -p", () => {
    expect(parsed("-p")).toHaveProperty("parseable", true);
  });

  it("provides --toposort", () => {
    expect(parsed("--toposort")).toHaveProperty("toposort", true);
  });

  it("provides --graph", () => {
    expect(parsed("--graph")).toHaveProperty("graph", true);
  });
});
