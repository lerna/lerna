import fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cc = require("../index");

const objx = {
  rand: Math.random(),
};

const tmpDir = fs.mkdtempSync(join(fs.realpathSync(tmpdir()), "lerna-test-"));
const tmpFile = join(tmpDir, "random-test-config.json");

fs.writeFileSync(tmpFile, JSON.stringify(objx));

test("find path", () => {
  const path = cc.find(tmpFile);

  expect(path).toBe(tmpFile);
});
