// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import fs from "fs";
import ini from "ini";
import { join } from "path";
import { dirSync } from "tmp";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CC = require("../index").ConfigChain;

const tmpDir = dirSync();
const f1 = join(tmpDir.name, "f1.ini");
const f2 = join(tmpDir.name, "f2.json");

const f1data = { foo: { bar: "baz" }, bloo: "jaus" };
const f2data = { oof: { rab: "zab" }, oolb: "suaj" };

fs.writeFileSync(f1, ini.stringify(f1data), "utf8");
fs.writeFileSync(f2, JSON.stringify(f2data), "utf8");

// eslint-disable-next-line jest/no-done-callback
test("saving and loading ini files", (done) => {
  new CC()
    .add({ grelb: "blerg" }, "opt")
    .addFile(f1, "ini", "inifile")
    .addFile(f2, "json", "jsonfile")
    .on("load", function (cc) {
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
