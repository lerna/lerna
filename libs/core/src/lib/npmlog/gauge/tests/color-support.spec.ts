import type { MockInstance } from "vitest";
import os from "os";
import { colorSupport, type ColorSupportResult } from "../color-support";

describe("colorSupport", () => {
  const originalEnv = process.env;
  const originalStdout = process.stdout;
  let platformSpy: MockInstance;

  const hasNone: ColorSupportResult = { level: 0, hasBasic: false, has256: false, has16m: false };
  const hasBasic: ColorSupportResult = { level: 1, hasBasic: true, has256: false, has16m: false };
  const has256: ColorSupportResult = { level: 2, hasBasic: true, has256: true, has16m: false };
  const has16m: ColorSupportResult = { level: 3, hasBasic: true, has256: true, has16m: true };

  beforeEach(() => {
    process.env = { ...originalEnv };
    platformSpy = vi.spyOn(os, "platform");
    platformSpy.mockReturnValue("linux");
  });

  afterEach(() => {
    process.env = originalEnv;
    platformSpy.mockRestore();
  });

  it("returns no color for non-TTY stream", () => {
    expect(colorSupport({ isTTY: false })).toEqual(hasNone);
  });

  it("returns no color for TERM=dumb without COLORTERM", () => {
    process.env.TERM = "dumb";
    delete process.env.COLORTERM;
    expect(colorSupport({ isTTY: true })).toEqual(hasNone);
  });

  it("returns basic for win32", () => {
    platformSpy.mockReturnValue("win32");
    delete process.env.TERM;
    expect(colorSupport({ isTTY: true })).toEqual(hasBasic);
  });

  it("returns 256 for TMUX", () => {
    process.env.TMUX = "some junk";
    delete process.env.TERM;
    delete process.env.CI;
    delete process.env.TEAMCITY_VERSION;
    delete process.env.TERM_PROGRAM;
    expect(colorSupport({ isTTY: true })).toEqual(has256);
  });

  describe("TERM_PROGRAM", () => {
    beforeEach(() => {
      delete process.env.TMUX;
      delete process.env.CI;
      delete process.env.TEAMCITY_VERSION;
      delete process.env.TERM;
    });

    it("iTerm.app old version returns 256", () => {
      process.env.TERM_PROGRAM = "iTerm.app";
      process.env.TERM_PROGRAM_VERSION = "2.0.0";
      expect(colorSupport({ isTTY: true })).toEqual(has256);
    });

    it("iTerm.app v3+ returns 16m", () => {
      process.env.TERM_PROGRAM = "iTerm.app";
      process.env.TERM_PROGRAM_VERSION = "3.0.4";
      expect(colorSupport({ isTTY: true })).toEqual(has16m);
    });

    it("Hyper returns 16m", () => {
      process.env.TERM_PROGRAM = "Hyper";
      expect(colorSupport({ isTTY: true })).toEqual(has16m);
    });

    it("HyperTerm returns 16m", () => {
      process.env.TERM_PROGRAM = "HyperTerm";
      expect(colorSupport({ isTTY: true })).toEqual(has16m);
    });

    it("MacTerm returns 16m", () => {
      process.env.TERM_PROGRAM = "MacTerm";
      expect(colorSupport({ isTTY: true })).toEqual(has16m);
    });

    it("Apple_Terminal returns 256", () => {
      process.env.TERM_PROGRAM = "Apple_Terminal";
      expect(colorSupport({ isTTY: true })).toEqual(has256);
    });
  });

  describe("CI environments", () => {
    beforeEach(() => {
      delete process.env.TMUX;
      delete process.env.TERM_PROGRAM;
      delete process.env.TERM;
    });

    it("CI without TRAVIS returns no color", () => {
      process.env.CI = "1";
      delete process.env.TRAVIS;
      expect(colorSupport({ isTTY: true })).toEqual(hasNone);
    });

    it("TRAVIS returns 256", () => {
      process.env.CI = "1";
      process.env.TRAVIS = "1";
      expect(colorSupport({ isTTY: true })).toEqual(has256);
    });

    it("TEAMCITY_VERSION returns no color", () => {
      process.env.TEAMCITY_VERSION = "1";
      expect(colorSupport({ isTTY: true })).toEqual(hasNone);
    });
  });

  describe("TERM patterns", () => {
    beforeEach(() => {
      delete process.env.TMUX;
      delete process.env.CI;
      delete process.env.TEAMCITY_VERSION;
      delete process.env.TERM_PROGRAM;
      delete process.env.COLORTERM;
    });

    it("xterm-256color returns 256", () => {
      process.env.TERM = "xterm-256color";
      expect(colorSupport({ isTTY: true })).toEqual(has256);
    });

    it("screen returns basic", () => {
      process.env.TERM = "screen";
      expect(colorSupport({ isTTY: true })).toEqual(hasBasic);
    });

    it("xterm returns basic", () => {
      process.env.TERM = "xterm-something";
      expect(colorSupport({ isTTY: true })).toEqual(hasBasic);
    });

    it("vt100 returns basic", () => {
      process.env.TERM = "vt100";
      expect(colorSupport({ isTTY: true })).toEqual(hasBasic);
    });

    it("linux returns basic", () => {
      process.env.TERM = "linux";
      expect(colorSupport({ isTTY: true })).toEqual(hasBasic);
    });
  });

  it("COLORTERM makes it basic at least", () => {
    delete process.env.TMUX;
    delete process.env.CI;
    delete process.env.TEAMCITY_VERSION;
    delete process.env.TERM_PROGRAM;
    process.env.TERM = "definitely-not-a-known-term";
    process.env.COLORTERM = "yeah whatever";
    expect(colorSupport({ isTTY: true })).toEqual(hasBasic);
  });

  it("returns no color when nothing matches", () => {
    delete process.env.TMUX;
    delete process.env.CI;
    delete process.env.TEAMCITY_VERSION;
    delete process.env.TERM_PROGRAM;
    delete process.env.COLORTERM;
    process.env.TERM = "definitely-not-a-known-term";
    expect(colorSupport({ isTTY: true })).toEqual(hasNone);
  });
});
