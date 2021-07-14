"use strict";

// windows sucks
jest.mock("has-unicode", () => () => false);

const { loggingOutput } = require("@lerna-test/logging-output");
const { logPacked } = require("../lib/log-packed");

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === "string";
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

const fixture = [
  {
    id: "package-1@1.1.0",
    name: "package-1",
    version: "1.1.0",
    size: 223,
    unpackedSize: 396,
    shasum: "8f339308bfabffcddd89e379ab76c8fbbc5c429a",
    integrity:
      "sha512-s+D+5+Kovk2mi2Jg+P6egJ6ZBKzMOdRaWAL5S+a4dWnRa6taym9EeEwpwx5ASF1wbLb0Tduv2XqcwFATxxUGVw==",
    // filename only present when writing a file (e.g., `lerna pack`)
    files: [
      {
        path: "package.json",
        size: 396,
        mode: 420,
      },
    ],
    entryCount: 1,
    bundled: [],
  },
  {
    id: "package-2@1.1.0",
    name: "package-2",
    version: "1.1.0",
    size: 172,
    unpackedSize: 99,
    shasum: "9a868dcbaa1812afb10ae2366909d6bf3a1c6f95",
    integrity:
      "sha512-k9Ao8IyLZUq2fAT3a/8/B5lQI6de7mTTMuyUHjs6XVbKo69zQpKtBjFqk8DCh78gEyd05Ls4NbMINb3uj3wxkw==",
    filename: "package-2-1.1.0.tgz",
    files: [
      {
        path: "package.json",
        size: 99,
        mode: 420,
      },
      {
        path: "node_modules/bundled-dep/package.json",
        size: 69,
        mode: 420,
      },
    ],
    entryCount: 2,
    bundled: ["bundled-dep"],
  },
];

describe("log-packed", () => {
  it("logs tarball contents from json", () => {
    fixture.forEach((f) => logPacked(f));

    expect(loggingOutput().join("\n")).toMatchInlineSnapshot(`

package: package-1@1.1.0
=== Tarball Contents ===
396B package.json
=== Tarball Details ===
name:          package-1
version:       1.1.0
package size:  223 B
unpacked size: 396 B
shasum:        8f339308bfabffcddd89e379ab76c8fbbc5c429a
integrity:     sha512-s+D+5+Kovk2mi[...]XqcwFATxxUGVw==
total files:   1


package: package-2@1.1.0
=== Tarball Contents ===
99B package.json
=== Bundled Dependencies ===
bundled-dep
=== Tarball Details ===
name:          package-2
version:       1.1.0
filename:      package-2-1.1.0.tgz
package size:  172 B
unpacked size: 99 B
shasum:        9a868dcbaa1812afb10ae2366909d6bf3a1c6f95
integrity:     sha512-k9Ao8IyLZUq2f[...]bMINb3uj3wxkw==
bundled deps:  1
bundled files: 1
own files:     1
total files:   2

`);
  });

  it("accepts options.unicode", () => {
    const options = { unicode: true };
    logPacked(fixture[0], options);

    const [, headline] = loggingOutput("notice");
    // windows can't handle it, hence the convolutions
    expect(headline).not.toMatch("package: package-1@1.1.0");
    expect(headline).toMatch(/^(.*)+ package-1@1.1.0$/);
  });

  it("accepts options.log", () => {
    const options = { log: { notice: jest.fn() } };
    logPacked(fixture[1], options);

    expect(options.log.notice).toHaveBeenCalledWith("=== Tarball Contents ===");
    expect(loggingOutput()).toHaveLength(0);
  });

  it("handles empty files array (weird)", () => {
    logPacked({ files: [], bundled: [], integrity: "" });
    expect(loggingOutput().join("\n")).not.toMatch("=== Tarball Contents ===");
  });
});
