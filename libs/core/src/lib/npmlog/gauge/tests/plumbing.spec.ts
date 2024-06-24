/* eslint-disable @typescript-eslint/no-var-requires */

// eslint-disable-next-line jest/no-export
export {};

const Plumbing = require("../plumbing");
jest.mock("../render-template", () => (width: string, template: any, values: { x: any }) => {
  if (values.x) {
    // eslint-disable-next-line no-self-assign
    values.x = values.x;
  } // pull in from parent object for stringify
  return "w:" + width + ", t:" + JSON.stringify(template) + ", v:" + JSON.stringify(values);
});
jest.mock("console-control-strings", () => ({
  eraseLine: () => "ERASE",
  gotoSOL: () => "CR",
  color: (to: string) => "COLOR:" + to,
  hideCursor: () => "HIDE",
  showCursor: () => "SHOW",
}));

const template = [{ type: "name" }];
const theme = {};
const plumbing = new Plumbing(theme, template, 10);

describe("Plumbing static methods", () => {
  it("showCursor", () => {
    expect(plumbing.showCursor()).toBe("SHOW");
  });

  it("hideCursor", () => {
    expect(plumbing.hideCursor()).toBe("HIDE");
  });

  it("hide", () => {
    expect(plumbing.hide()).toBe("CRERASE");
  });

  it("show", () => {
    expect(plumbing.show({ name: "test" })).toBe(
      'w:10, t:[{"type":"name"}], v:{"name":"test"}COLOR:resetERASECR'
    );
  });

  it("width", () => {
    const defaultWidth = new Plumbing(theme, template);
    expect(defaultWidth.show({ name: "test" })).toBe(
      'w:80, t:[{"type":"name"}], v:{"name":"test"}COLOR:resetERASECR'
    );
  });

  it("setTheme", () => {
    plumbing.setTheme({ x: "abc" });
    expect(plumbing.show({ name: "test" })).toBe(
      'w:10, t:[{"type":"name"}], v:{"name":"test","x":"abc"}COLOR:resetERASECR'
    );
  });

  it("setTemplate", () => {
    plumbing.setTemplate([{ type: "name" }, { type: "x" }]);
    expect(plumbing.show({ name: "test" })).toBe(
      'w:10, t:[{"type":"name"},{"type":"x"}], v:{"name":"test","x":"abc"}COLOR:resetERASECR'
    );
  });

  it("setWidth", () => {
    plumbing.setWidth(20);
    expect(plumbing.show({ name: "test" })).toBe(
      'w:20, t:[{"type":"name"},{"type":"x"}], v:{"name":"test","x":"abc"}COLOR:resetERASECR'
    );
  });
});
