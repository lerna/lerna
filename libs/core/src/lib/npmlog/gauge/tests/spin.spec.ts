export {};

const spin = require("../spin");

describe("spin", () => {
  it("should return the correct spinner character", () => {
    const spinner: any = "123456";
    let result: any;

    result = spin(spinner, 1);
    expect(result).toBe("2"); // Spinner 1

    result = spin(spinner, 10);
    expect(result).toBe("5"); // Spinner 10
  });
});
