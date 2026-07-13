import type { MockInstance } from "vitest";
import os from "os";
import { hasUnicode } from "../has-unicode";

describe("hasUnicode", () => {
  const originalEnv = process.env;
  let osTypeSpy: MockInstance;

  beforeEach(() => {
    process.env = { ...originalEnv };
    osTypeSpy = vi.spyOn(os, "type");
  });

  afterEach(() => {
    process.env = originalEnv;
    osTypeSpy.mockRestore();
  });

  it("returns false on Windows", () => {
    osTypeSpy.mockReturnValue("Windows_NT");
    expect(hasUnicode()).toBe(false);
  });

  describe("Unix environments", () => {
    beforeEach(() => {
      osTypeSpy.mockReturnValue("Linux");
    });

    it("returns true for UTF-8 LANG", () => {
      delete process.env.LC_ALL;
      delete process.env.LC_CTYPE;
      process.env.LANG = "en_US.UTF-8";
      expect(hasUnicode()).toBe(true);
    });

    it("returns true for UTF-8 LC_ALL", () => {
      process.env.LC_ALL = "en_US.UTF-8";
      delete process.env.LC_CTYPE;
      delete process.env.LANG;
      expect(hasUnicode()).toBe(true);
    });

    it("returns false with no locale setting", () => {
      delete process.env.LC_ALL;
      delete process.env.LC_CTYPE;
      delete process.env.LANG;
      expect(hasUnicode()).toBe(false);
    });

    it("returns true for UTF-8 LC_CTYPE", () => {
      delete process.env.LC_ALL;
      process.env.LC_CTYPE = "en_US.UTF-8";
      delete process.env.LANG;
      expect(hasUnicode()).toBe(true);
    });

    it("returns true for bare UTF-8 LC_CTYPE", () => {
      delete process.env.LC_ALL;
      process.env.LC_CTYPE = "UTF-8";
      delete process.env.LANG;
      expect(hasUnicode()).toBe(true);
    });

    it("LC_ALL overrides other vars", () => {
      process.env.LC_ALL = "C";
      process.env.LC_CTYPE = "en_US.UTF-8";
      process.env.LANG = "en_US.UTF-8";
      expect(hasUnicode()).toBe(false);
    });

    it("LC_CTYPE overrides LANG", () => {
      delete process.env.LC_ALL;
      process.env.LC_CTYPE = "en_US";
      process.env.LANG = "en_US.UTF-8";
      expect(hasUnicode()).toBe(false);
    });

    it("returns true for utf8 (lowercase, no hyphen)", () => {
      delete process.env.LC_ALL;
      delete process.env.LC_CTYPE;
      process.env.LANG = "de_DE.utf8";
      expect(hasUnicode()).toBe(true);
    });
  });
});
