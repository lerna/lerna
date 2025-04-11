export {};

const error = require("../error");

describe("User", () => {
  it("isa Error", () => {
    const msg = "example";
    const user = new error.User(msg);
    expect(user instanceof Error).toBeTruthy();
    expect(user.code).toBe("EGAUGE");
    expect(user.message).toBe(msg);
  });
});

describe("MissingTemplateValue", () => {
  it("isa Error", () => {
    const item = { type: "abc" };
    const values = { abc: "def", ghi: "jkl" };
    const user = new error.MissingTemplateValue(item, values);
    expect(user instanceof Error).toBeTruthy();
    expect(user.code).toBe("EGAUGE");
    expect(user.message).toMatch(new RegExp(item.type));
    expect(user.template).toEqual(item);
    expect(user.values).toEqual(values);
  });
});

describe("Internal", () => {
  it("isa Error", () => {
    const msg = "example";
    const user = new error.Internal(msg);
    expect(user instanceof Error).toBeTruthy();
    expect(user.code).toBe("EGAUGEINTERNAL");
    expect(user.message).toBe(msg);
  });
});
