// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import ini from "ini";

const cc = require("../index");

test("Testing parse equivalence", () => {
  const _json = JSON.stringify({ hello: true });
  const _ini = ini.stringify({ hello: true });

  expect(cc.parse(_json)).toEqual(cc.parse(_ini));
});
