// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import cc from "../index";

test("does not throw", () => {
  expect(() => {
    cc(__dirname, "non_existing_file");
  }).not.toThrow();
});
