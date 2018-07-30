"use strict";

const yargs = require("yargs/yargs");
const listable = require("..");

describe("listable.options()", () => {
  const parsed = (...args) => listable.options(yargs()).parse(args.join(" "));

  it("provides --json", () => {
    expect(parsed("--json")).toHaveProperty("json", true);
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
});
