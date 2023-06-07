// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import fs from "fs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cc = require("../index");

const objx = {
  rand: Math.random(),
};

fs.writeFileSync("/tmp/random-test-config.json", JSON.stringify(objx));

test("find path", () => {
  const path = cc.find("tmp/random-test-config.json");

  expect(path).toBe("/tmp/random-test-config.json");
});
