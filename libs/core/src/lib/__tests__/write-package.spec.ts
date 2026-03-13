import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "path";
import { writePackage } from "../write-package";

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "write-package-test-"));
}

describe("writePackage", () => {
  it("sorts dependency keys alphabetically", async () => {
    const dir = await createTempDir();
    const filePath = path.join(dir, "package.json");

    await writePackage(filePath, {
      name: "test",
      scripts: { b: "1", a: "1" },
      dependencies: { foo: "1.0.0", bar: "1.0.0" },
      devDependencies: { foo: "1.0.0", bar: "1.0.0" },
      optionalDependencies: { foo: "1.0.0", bar: "1.0.0" },
      peerDependencies: { foo: "1.0.0", bar: "1.0.0" },
    });

    const result = JSON.parse(await readFile(filePath, "utf8"));
    // scripts should NOT be sorted
    expect(Object.keys(result.scripts)).toEqual(["b", "a"]);
    // dependency keys should be sorted
    expect(Object.keys(result.dependencies)).toEqual(["bar", "foo"]);
    expect(Object.keys(result.devDependencies)).toEqual(["bar", "foo"]);
    expect(Object.keys(result.optionalDependencies)).toEqual(["bar", "foo"]);
    expect(Object.keys(result.peerDependencies)).toEqual(["bar", "foo"]);
  });

  it("detects tab indent from existing file", async () => {
    const dir = await createTempDir();
    const filePath = path.join(dir, "package.json");

    // Write a file with tab indent first
    await writeFile(filePath, '{\n\t"name": "test"\n}\n');

    await writePackage(filePath, { name: "test", version: "1.0.0" });

    const content = await readFile(filePath, "utf8");
    expect(content).toBe('{\n\t"name": "test",\n\t"version": "1.0.0"\n}\n');
  });

  it("detects 2-space indent from existing file", async () => {
    const dir = await createTempDir();
    const filePath = path.join(dir, "package.json");

    // Write a file with 2-space indent first
    await writeFile(filePath, '{\n  "name": "test"\n}\n');

    await writePackage(filePath, { name: "test", version: "1.0.0" });

    const content = await readFile(filePath, "utf8");
    expect(content).toBe('{\n  "name": "test",\n  "version": "1.0.0"\n}\n');
  });

  it("defaults to 2-space indent when file does not exist", async () => {
    const dir = await createTempDir();
    const filePath = path.join(dir, "package.json");

    await writePackage(filePath, { name: "test", version: "1.0.0" });

    const content = await readFile(filePath, "utf8");
    expect(content).toBe('{\n  "name": "test",\n  "version": "1.0.0"\n}\n');
  });

  it("appends package.json to directory paths", async () => {
    const dir = await createTempDir();

    await writePackage(dir, { name: "test", version: "1.0.0" });

    const content = await readFile(path.join(dir, "package.json"), "utf8");
    expect(content).toBe('{\n  "name": "test",\n  "version": "1.0.0"\n}\n');
  });

  it("preserves empty dependency objects", async () => {
    const dir = await createTempDir();
    const filePath = path.join(dir, "package.json");

    await writePackage(filePath, {
      name: "test",
      dependencies: {},
      devDependencies: {},
    });

    const result = JSON.parse(await readFile(filePath, "utf8"));
    expect(result.dependencies).toEqual({});
    expect(result.devDependencies).toEqual({});
  });

  it("writes with trailing newline", async () => {
    const dir = await createTempDir();
    const filePath = path.join(dir, "package.json");

    await writePackage(filePath, { name: "test" });

    const content = await readFile(filePath, "utf8");
    expect(content.endsWith("\n")).toBe(true);
    expect(content.endsWith("\n\n")).toBe(false);
  });
});
