// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import fs from "fs";
import { join } from "path";
import { dirSync } from "tmp";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cc = require("../index");

const objx = {
  rand: Math.random(),
};

const tmpDir = dirSync();
const tmpFile = join(tmpDir.name, "random-test-config.json");

fs.writeFileSync(tmpFile, JSON.stringify(objx));

test("find path", () => {
  const path = cc.find(tmpFile);

  expect(path).toBe(tmpFile);
});
