// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cc = require("../index");

test("throws on invalid json", () => {
  expect(() => {
    cc(__dirname + "/__fixtures__/broken.json");
  }).toThrow();
});
