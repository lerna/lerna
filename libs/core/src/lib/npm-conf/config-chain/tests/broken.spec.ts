// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import cc from "../index";

test("throws on invalid json", () => {
  expect(() => {
    cc(__dirname + "/__fixtures__/broken.json");
  }).toThrow();
});
