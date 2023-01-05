// eslint-disable-next-line @typescript-eslint/no-var-requires
const npmConf = require("./npm-conf");

describe("npm-conf", () => {
  it("exports default factory", () => {
    expect(npmConf).toBeDefined();
    expect(typeof npmConf).toBe("function");
  });

  it("exports named defaults", () => {
    const { defaults } = npmConf;
    expect(defaults).toBeDefined();
    expect(typeof defaults).toBe("object");
  });

  it("exports named Conf", () => {
    const { Conf } = npmConf;
    expect(Conf).toBeDefined();
    expect(typeof Conf).toBe("function");
  });

  it("exports named toNerfDart", () => {
    const { toNerfDart } = npmConf;
    expect(toNerfDart).toBeDefined();
    expect(typeof toNerfDart).toBe("function");
    expect(toNerfDart("https://npm.example.com")).toBe("//npm.example.com/");
    expect(toNerfDart("https://npm.example.com/some-api/npm-virtual/")).toBe(
      "//npm.example.com/some-api/npm-virtual/"
    );
  });

  it("defaults cli parameter to empty object", () => {
    const conf = npmConf();

    expect(conf.sources.cli.data).toEqual({});
  });

  it("overwrites default with cli key", () => {
    const conf = npmConf({ registry: "https://npm.example.com" });

    expect(conf.get("registry")).toBe("https://npm.example.com");
  });

  it("does not overwrite default with undefined cli key", () => {
    const conf = npmConf({ registry: undefined });

    expect(conf.get("registry")).toBe("https://registry.npmjs.org/");
  });
});
