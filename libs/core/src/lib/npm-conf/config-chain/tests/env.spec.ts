// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cc = require("../index");

test("environment", () => {
  expect(
    cc.env("test_", {
      test_hello: true,
      ignore_this: 4,
      ignore_test_this_too: [],
    })
  ).toEqual({
    hello: true,
  });
});
