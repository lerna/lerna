export {};

const TemplateItem = require("../template-item");

const width = 200;
const defaults: any = {
  overallOutputLength: width,
  finished: false,
  type: null,
  value: null,
  length: null,
  maxLength: null,
  minLength: null,
  kerning: null,
  align: "left",
  padLeft: 0,
  padRight: 0,
  index: null,
  first: null,
  last: null,
};

function got(values: any): any {
  return new TemplateItem(values, width);
}

function expected(obj: any): any {
  return Object.assign({}, defaults, obj);
}

describe("TemplateItem", () => {
  it("should create new TemplateItem correctly", () => {
    expect(got("test")).toEqual(expected({ value: "test" })); // str item
    expect(got({ value: "test", length: 3 })).toEqual(expected({ value: "test", length: 3 })); // obj item
    expect(got({ length: "20%" })).toEqual(expected({ length: 40 })); // length %
    expect(got({ maxLength: "10%" })).toEqual(expected({ maxLength: 20 })); // length %
    expect(got({ minLength: "95%" })).toEqual(expected({ minLength: 190 })); // length %
  });

  it("getBaseLength", () => {
    const direct = got({ value: "test", length: 3 });
    expect(direct.getBaseLength()).toBe(3); // directly set
    const intuit = got({ value: "test" });
    expect(intuit.getBaseLength()).toBe(4); // intuit
    const varmax = got({ value: "test", maxLength: 4 });
    expect(varmax.getBaseLength()).toBe(null); // variable max
    const varmin = got({ value: "test", minLength: 4 });
    expect(varmin.getBaseLength()).toBe(null); // variable min
  });

  it("getLength", () => {
    const direct = got({ value: "test", length: 3 });
    expect(direct.getLength()).toBe(3); // directly set
    const intuit = got({ value: "test" });
    expect(intuit.getLength()).toBe(4); // intuit
    const varmax = got({ value: "test", maxLength: 4 });
    expect(varmax.getLength()).toBe(null); // variable max
    const varmin = got({ value: "test", minLength: 4 });
    expect(varmin.getLength()).toBe(null); // variable min
    const padleft = got({ value: "test", length: 3, padLeft: 3 });
    expect(padleft.getLength()).toBe(6); // pad left
    const padright = got({ value: "test", length: 3, padLeft: 5 });
    expect(padright.getLength()).toBe(8); // pad right
    const padboth = got({ value: "test", length: 3, padLeft: 5, padRight: 1 });
    expect(padboth.getLength()).toBe(9); // pad both
  });

  it("getMaxLength", () => {
    const nomax = got({ value: "test" });
    expect(nomax.getMaxLength()).toBe(null); // no max length
    const direct = got({ value: "test", maxLength: 5 });
    expect(direct.getMaxLength()).toBe(5); // max length
    const padleft = got({ value: "test", maxLength: 5, padLeft: 3 });
    expect(padleft.getMaxLength()).toBe(8); // max length + padLeft
    const padright = got({ value: "test", maxLength: 5, padRight: 3 });
    expect(padright.getMaxLength()).toBe(8); // max length + padRight
    const padboth = got({ value: "test", maxLength: 5, padLeft: 2, padRight: 3 });
    expect(padboth.getMaxLength()).toBe(10); // max length + pad both
  });

  it("getMinLength", () => {
    const nomin = got({ value: "test" });
    expect(nomin.getMinLength()).toBe(null); // no min length
    const direct = got({ value: "test", minLength: 5 });
    expect(direct.getMinLength()).toBe(5); // min length
    const padleft = got({ value: "test", minLength: 5, padLeft: 3 });
    expect(padleft.getMinLength()).toBe(8); // min length + padLeft
    const padright = got({ value: "test", minLength: 5, padRight: 3 });
    expect(padright.getMinLength()).toBe(8); // min length + padRight
    const padboth = got({ value: "test", minLength: 5, padLeft: 2, padRight: 3 });
    expect(padboth.getMinLength()).toBe(10); // min length + pad both
  });
});
