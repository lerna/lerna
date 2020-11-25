"use strict";

// always make-believe it is a CI environment,
// as that simplifies normalization of snapshots
jest.mock("@npmcli/ci-detect", () => () => "Arbitrary CI");

const path = require("path");
// npmlog is an EventEmitter
const EventEmitter = require("events");
const { version: pkgVersion } = require("../package.json");

// workaround TypeError when assigning readonly properties
Object.defineProperty(process, "platform", {
  ...Object.getOwnPropertyDescriptor(process, "platform"),
  writable: true,
});

const npmrcFixturePath = path.resolve(__dirname, "__fixtures__/npmrc");
const originalPlatform = process.platform;
const originalStdoutTTY = process.stdout.isTTY;

afterEach(() => {
  process.platform = originalPlatform;
  process.stdout.isTTY = originalStdoutTTY;
});

beforeEach(() => {
  jest.resetModules();

  // normalize various process values
  process.platform = "linux";
  process.env.LANG = "en_US.UTF-8";
  process.stdout.isTTY = false;

  // delete all sensitive env values (set by `npm test`, for example)
  Object.keys(process.env)
    .filter((k) => /^npm_/.test(k))
    .forEach((k) => delete process.env[k]);

  delete process.env.PREFIX;
  delete process.env.DESTDIR;

  delete process.env.EDITOR;
  delete process.env.VISUAL;

  delete process.env.ComSpec;
  delete process.env.SHELL;

  delete process.env.LC_ALL;
  delete process.env.LC_CTYPE;

  delete process.env.LOCALAPPDATA;
  delete process.env.NODE;

  // _except_ userconfig, which we use to divorce tests from private user-global state
  process.env.npm_config_userconfig = npmrcFixturePath;
});

/* eslint-disable global-require */

test("flatOptions", async () => {
  const { NpmConfig } = require("..");
  const conf = new NpmConfig();

  expect(conf.flatOptions).toBeUndefined();
  expect(() => conf.color).toThrowError();

  await conf.load();
  const opts = conf.flatOptions;

  // one-and-done evaluation
  expect(opts).toBe(conf.flatOptions);

  expect(conf.flatOptions).toMatchSnapshot({
    // normalize platform- and user-specific fields
    cache: expect.any(String),
    dmode: expect.any(Number),
    fmode: expect.any(Number),
    globalPrefix: expect.any(String),
    localPrefix: expect.any(String),
    log: expect.any(EventEmitter),
    nodeBin: expect.any(String),
    nodeVersion: expect.any(String),
    npmSession: expect.any(String),
    npmVersion: pkgVersion,
    prefix: expect.any(String),
    shell: expect.any(String),
    tmp: expect.any(String),
    umask: expect.any(Number),
    userAgent: expect.any(String),
  });

  expect(opts.localPrefix).toBe(process.cwd());
  expect(opts.prefix).toBe(process.cwd());

  expect(opts.nodeBin).toBe(process.execPath);
  expect(opts.nodeVersion).toBe(process.version);

  expect(opts.dmode).toBe(conf.modes.exec);
  expect(opts.fmode).toBe(conf.modes.file);
  expect(opts.umask).toBe(conf.modes.umask);

  expect(opts.cache).toMatch(/.*_cacache$/);
  expect(opts.tmp).toMatch(/.*lerna-[\d]+-[0-9a-f]+$/);
});

test("custom env (linux)", async () => {
  process.env.EDITOR = "test-editor";
  process.env.SHELL = "/test/sh";
  process.env.LC_ALL = "C";
  process.env.NODE = "/path/to/node-bin";

  const { NpmConfig } = require("..");
  const conf = new NpmConfig();
  await conf.load();
  const opts = conf.flatOptions;

  expect(opts.nodeBin).toBe("/path/to/node-bin");
  expect(opts.editor).toBe("test-editor");
  expect(opts.shell).toBe("/test/sh");
  expect(opts.unicode).toBe(false);
});

test("windows", async () => {
  process.platform = "win32";

  const { NpmConfig } = require("..");
  const conf = new NpmConfig();
  await conf.load();
  const opts = conf.flatOptions;

  expect(opts.cache).toContain(path.join("/npm-cache", "_cacache"));
  expect(opts.editor).toBe("notepad.exe");
  expect(opts.shell).toBe("cmd");
  expect(opts.viewer).toBe("browser");
});

test("custom env (windows)", async () => {
  process.platform = "win32";

  process.env.LOCALAPPDATA = "/local-app-data";
  process.env.VISUAL = "windows-editor";
  process.env.ComSpec = "i-am-comspec";
  process.env.LC_CTYPE = "zh_HK.big5hkscs";

  const { NpmConfig } = require("..");
  const conf = new NpmConfig();
  await conf.load();
  const opts = conf.flatOptions;

  expect(opts.cache).toContain(path.join("/local-app-data/npm-cache", "_cacache"));
  expect(opts.editor).toBe("windows-editor");
  expect(opts.shell).toBe("i-am-comspec");
  expect(opts.unicode).toBe(false);
});

test("color='always'", async () => {
  const { NpmConfig } = require("..");
  const conf = new NpmConfig({ color: "always" });
  await conf.load();
  const opts = conf.flatOptions;

  expect(opts.color).toBe(true);
});

test("color=false", async () => {
  process.stdout.isTTY = true;

  const { NpmConfig } = require("..");
  const conf = new NpmConfig({ color: false });
  await conf.load();
  const opts = conf.flatOptions;

  expect(opts.color).toBe(false);
});

test("color=isTTY", async () => {
  process.stdout.isTTY = true;

  const { NpmConfig } = require("..");
  const conf = new NpmConfig();
  await conf.load();
  const opts = conf.flatOptions;

  expect(opts.color).toBe(true);
});

test("snapshot", async () => {
  const { NpmConfig } = require("..");
  const conf = new NpmConfig();
  await conf.load();

  conf.set("tag", "foo");

  expect(conf.snapshot).toMatchObject({
    // updated with new assignment
    defaultTag: "foo",
    // still has stuff defined "outside" flattenConfig()
    npmBin: "npm",
  });

  // flatOptions remains frozen
  expect(conf.flatOptions.defaultTag).toBe("latest");
});
