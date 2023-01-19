import fs from "fs";
import path from "path";
import stream from "stream";
import tempWrite from "./temp-write";

describe("@lerna/temp-write", () => {
  it("tempWrite(string)", async () => {
    const filePath = await tempWrite("unicorn", "test.png");
    expect(fs.readFileSync(filePath, "utf8")).toEqual("unicorn");
    expect(path.basename(filePath)).toEqual("test.png");
  });

  it("tempWrite(buffer)", async () => {
    const filePath = await tempWrite(Buffer.from("unicorn"), "test.png");
    expect(fs.readFileSync(filePath, "utf8")).toEqual("unicorn");
  });

  it("tempWrite(buffer, path)", async () => {
    const filePath = await tempWrite(Buffer.from("unicorn"), "foo/bar/test.png");
    expect(fs.readFileSync(filePath, "utf8")).toEqual("unicorn");

    const regexp = process.platform === "win32" ? /foo\\bar\\test\.png$/ : /foo\/bar\/test\.png$/;
    expect(filePath).toMatch(regexp);
  });

  it("tempWrite(stream)", async () => {
    const readable = new stream.Readable({
      read() {}, // Noop
    });
    readable.push("unicorn");
    readable.push(null);
    const filePath = await tempWrite(readable, "test.png");
    expect(fs.readFileSync(filePath, "utf8")).toEqual("unicorn");
  });

  it("tempWrite.sync()", () => {
    expect(fs.readFileSync(tempWrite.sync("unicorn"), "utf8")).toEqual("unicorn");
  });
});
