"use strict";

const npmConf = require("..");

describe("@lerna/npm-conf", () => {
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
});
