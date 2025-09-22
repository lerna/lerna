import fs from "node:fs";
// @ts-expect-error - No types
import ini from "ini";
import { join } from "node:path";
import { directory } from "tempy";

const CC = require("../index").ConfigChain;

const tmpDir = directory();
const f1 = join(tmpDir, "f1.ini");
const f2 = join(tmpDir, "f2.json");

const f1data = { foo: { bar: "baz" }, bloo: "jaus" };
const f2data = { oof: { rab: "zab" }, oolb: "suaj" };

fs.writeFileSync(f1, ini.stringify(f1data), "utf8");
fs.writeFileSync(f2, JSON.stringify(f2data), "utf8");

test("saving and loading ini files", (done) => {
  new CC()
    .add({ grelb: "blerg" }, "opt")
    .addFile(f1, "ini", "inifile")
    .addFile(f2, "json", "jsonfile")
    .on("load", function (cc: any) {
      expect(cc.snapshot).toEqual({
        grelb: "blerg",
        bloo: "jaus",
        foo: { bar: "baz" },
        oof: { rab: "zab" },
        oolb: "suaj",
      });

      expect(cc.list).toEqual([
        { grelb: "blerg" },
        { bloo: "jaus", foo: { bar: "baz" } },
        { oof: { rab: "zab" }, oolb: "suaj" },
      ]);

      cc.set("grelb", "brelg", "opt")
        .set("foo", "zoo", "inifile")
        .set("oof", "ooz", "jsonfile")
        .save("inifile")
        .save("jsonfile")
        .on("save", function () {
          expect(fs.readFileSync(f1, "utf8")).toBe("bloo=jaus\nfoo=zoo\n");
          expect(fs.readFileSync(f2, "utf8")).toBe('{"oof":"ooz","oolb":"suaj"}');

          expect(cc.snapshot).toEqual({ grelb: "brelg", bloo: "jaus", foo: "zoo", oof: "ooz", oolb: "suaj" });

          expect(cc.list).toEqual([
            { grelb: "brelg" },
            { bloo: "jaus", foo: "zoo" },
            { oof: "ooz", oolb: "suaj" },
          ]);

          done();
        });
    });
});
