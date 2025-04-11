// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import fs from "fs";
import http from "http";
import ini from "ini";

const CC = require("../index").ConfigChain;

const env = { foo_blaz: "blzaa", foo_env: "myenv" };
const jsonObj = { blaz: "json", json: true };
const iniObj = { "x.y.z": "xyz", blaz: "ini" };

fs.writeFileSync("/tmp/config-chain-class.json", JSON.stringify(jsonObj));
fs.writeFileSync("/tmp/config-chain-class.ini", ini.stringify(iniObj));

let reqs = 0;
http
  .createServer(function (q, s) {
    if (++reqs === 2) this.close();
    if (q.url === "/json") {
      setTimeout(function () {
        s.setHeader("content-type", "application/json");
        s.end(
          JSON.stringify({
            blaz: "http",
            http: true,
            json: true,
          })
        );
      }, 200);
    } else {
      s.setHeader("content-type", "application/ini");
      s.end(
        ini.stringify({
          blaz: "http",
          http: true,
          ini: true,
          json: false,
        })
      );
    }
  })
  .listen(1337);

test("basic class test", (done) => {
  const cc = new CC();
  const expectlist = [
    { blaz: "json", json: true },
    { "x.y.z": "xyz", blaz: "ini" },
    { blaz: "blzaa", env: "myenv" },
    { blaz: "http", http: true, json: true },
    { blaz: "http", http: true, ini: true, json: false },
  ];

  cc.addFile("/tmp/config-chain-class.json")
    .addFile("/tmp/config-chain-class.ini")
    .addEnv("foo_", env)
    .addUrl("http://localhost:1337/json")
    .addUrl("http://localhost:1337/ini")
    .on("load", function () {
      expect(cc.list).toEqual(expectlist);
      expect(cc.snapshot).toEqual({
        blaz: "json",
        json: true,
        "x.y.z": "xyz",
        env: "myenv",
        http: true,
        ini: true,
      });

      cc.del("blaz", "/tmp/config-chain-class.json");
      expect(cc.snapshot).toEqual({
        blaz: "ini",
        json: true,
        "x.y.z": "xyz",
        env: "myenv",
        http: true,
        ini: true,
      });
      cc.del("blaz");
      expect(cc.snapshot).toEqual({ json: true, "x.y.z": "xyz", env: "myenv", http: true, ini: true });
      cc.shift();
      expect(cc.snapshot).toEqual({ "x.y.z": "xyz", env: "myenv", http: true, json: true, ini: true });
      cc.shift();
      expect(cc.snapshot).toEqual({ env: "myenv", http: true, json: true, ini: true });
      cc.shift();
      expect(cc.snapshot).toEqual({ http: true, json: true, ini: true });
      cc.shift();
      expect(cc.snapshot).toEqual({ http: true, ini: true, json: false });
      cc.shift();
      expect(cc.snapshot).toEqual({});
      done();
    });
});
