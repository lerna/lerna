import fs from "node:fs";
import { join } from "node:path";
import { directory } from "tempy";

const cc = require("../index");

const objx = {
  rand: Math.random(),
};

const tmpDir = directory();
const tmpFile = join(tmpDir, "random-test-config.json");

fs.writeFileSync(tmpFile, JSON.stringify(objx));

test("find path", () => {
  const path = cc.find(tmpFile);

  expect(path).toBe(tmpFile);
});
