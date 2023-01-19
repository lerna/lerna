/* eslint-disable @nrwl/nx/enforce-module-boundaries */
// nx-ignore-next-line
import { loggingOutput } from "@lerna/test-helpers";
import { logPacked } from "./log-packed";

// windows sucks
jest.mock("has-unicode", () => () => false);

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
    filename: "package-1-1.1.0.tgz",
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
    ],
    entryCount: 1,
    bundled: [],
  },
];

describe("@lerna/log-packed", () => {
  it("logs tarball contents from json", () => {
    fixture.forEach(logPacked);

    expect(loggingOutput().join("\n")).toMatchInlineSnapshot(`

package: package-1@1.1.0
=== Tarball Contents ===
396B package.json
=== Tarball Details ===
name:          package-1
version:       1.1.0
filename:      package-1-1.1.0.tgz
package size:  223 B
unpacked size: 396 B
shasum:        8f339308bfabffcddd89e379ab76c8fbbc5c429a
integrity:     sha512-s+D+5+Kovk2mi[...]XqcwFATxxUGVw==
total files:   1


package: package-2@1.1.0
=== Tarball Contents ===
99B package.json
=== Tarball Details ===
name:          package-2
version:       1.1.0
filename:      package-2-1.1.0.tgz
package size:  172 B
unpacked size: 99 B
shasum:        9a868dcbaa1812afb10ae2366909d6bf3a1c6f95
integrity:     sha512-k9Ao8IyLZUq2f[...]bMINb3uj3wxkw==
total files:   1

`);
  });

  it("safely ignores missing fields from incomplete json", () => {
    // this is the output of the legacy npm pack (no --json) call
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    logPacked({
      name: "package-3",
      version: "3.1.0",
      filename: "package-3-3.1.0.tgz",
    });

    expect(loggingOutput().join("\n")).toMatchInlineSnapshot(`

package: package-3@3.1.0
=== Tarball Details ===
name:     package-3
version:  3.1.0
filename: package-3-3.1.0.tgz

`);
  });
});
