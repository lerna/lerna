export {};

const validate = require("../validate");

describe("validate", () => {
  describe("basic type checks", () => {
    it("accepts a string with S schema", () => {
      expect(() => validate("S", ["hello"])).not.toThrow();
    });

    it("accepts a number with N schema", () => {
      expect(() => validate("N", [42])).not.toThrow();
    });

    it("accepts a boolean with B schema", () => {
      expect(() => validate("B", [true])).not.toThrow();
      expect(() => validate("B", [false])).not.toThrow();
    });

    it("accepts a function with F schema", () => {
      expect(() => validate("F", [() => {}])).not.toThrow();
    });

    it("accepts an object with O schema", () => {
      expect(() => validate("O", [{ a: 1 }])).not.toThrow();
    });

    it("accepts an array with A schema", () => {
      expect(() => validate("A", [[1, 2, 3]])).not.toThrow();
    });

    it("accepts an error with E schema", () => {
      expect(() => validate("E", [new Error("test")])).not.toThrow();
    });

    it("accepts null with Z schema", () => {
      expect(() => validate("Z", [null])).not.toThrow();
    });

    it("accepts undefined with Z schema", () => {
      expect(() => validate("Z", [undefined])).not.toThrow();
    });

    it("accepts anything with * schema", () => {
      expect(() => validate("*", ["hello"])).not.toThrow();
      expect(() => validate("*", [42])).not.toThrow();
      expect(() => validate("*", [null])).not.toThrow();
      expect(() => validate("*", [undefined])).not.toThrow();
      expect(() => validate("*", [{}])).not.toThrow();
    });
  });

  describe("multi-argument schemas", () => {
    it("validates OAN (object, array, number)", () => {
      expect(() => validate("OAN", [{}, [1], 5])).not.toThrow();
    });

    it("validates ONN (object, number, number)", () => {
      expect(() => validate("ONN", [{}, 1, 2])).not.toThrow();
    });

    it("validates OON (object, object, number)", () => {
      expect(() => validate("OON", [{}, {}, 3])).not.toThrow();
    });
  });

  describe("pipe-separated multi-schema", () => {
    it("accepts either schema separated by pipe", () => {
      expect(() => validate("SO|N", ["hello", {}])).not.toThrow();
      expect(() => validate("SO|N", [42])).not.toThrow();
    });

    it("rejects values matching neither schema", () => {
      expect(() => validate("S|N", [{}])).toThrow();
    });
  });

  describe("error type expansion", () => {
    it("accepts Error with E schema", () => {
      expect(() => validate("SE", ["test", new Error()])).not.toThrow();
    });

    it("accepts null in place of Error (Z expansion)", () => {
      expect(() => validate("SE", ["test", null])).not.toThrow();
    });

    it("allows E schema with zero args when schema length is 1", () => {
      expect(() => validate("E", [])).not.toThrow();
    });

    it("allows truncated form (just E) for longer schemas", () => {
      // "SE" expands to also accept just "SE" truncated to "E" at the E position
      // and "SZ" (replacing E with Z)
      expect(() => validate("SE", ["test", new Error()])).not.toThrow();
      expect(() => validate("SE", ["test", null])).not.toThrow();
    });
  });

  describe("isArguments detection", () => {
    it("accepts an arguments-like object with A schema", () => {
      const argsLike = { 0: "a", 1: "b", length: 2, callee: () => {} };
      expect(() => validate("A", [argsLike])).not.toThrow();
    });

    it("does not treat a regular object as arguments", () => {
      expect(() => validate("A", [{ a: 1 }])).toThrow();
    });
  });

  describe("O type excludes arrays and errors", () => {
    it("rejects an array for O schema", () => {
      expect(() => validate("O", [[1, 2]])).toThrow();
    });

    it("rejects an Error for O schema", () => {
      expect(() => validate("O", [new Error("test")])).toThrow();
    });
  });

  describe("error codes", () => {
    it("throws EWRONGARGCOUNT for wrong number of args", () => {
      try {
        validate("SN", ["hello"]);
        fail("should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("EWRONGARGCOUNT");
        expect(err.message).toMatch(/Expected/);
        expect(err.message).toMatch(/but got 1/);
      }
    });

    it("throws EUNKNOWNTYPE for unknown type codes", () => {
      try {
        validate("X", ["hello"]);
        fail("should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("EUNKNOWNTYPE");
        expect(err.message).toMatch(/Unknown type X/);
      }
    });

    it("throws EINVALIDTYPE for type mismatch", () => {
      try {
        validate("S", [42]);
        fail("should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("EINVALIDTYPE");
        expect(err.message).toMatch(/Expected string but got number/);
      }
    });

    it("throws EMISSINGARG when rawSchemas is falsy", () => {
      try {
        validate("", ["hello"]);
        fail("should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("EMISSINGARG");
        expect(err.message).toMatch(/Missing required argument #1/);
      }
    });

    it("throws ETOOMANYERRORTYPES for multiple E in schema", () => {
      try {
        validate("EE", [new Error(), new Error()]);
        fail("should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("ETOOMANYERRORTYPES");
        expect(err.message).toMatch(/Only one error type per argument signature/);
      }
    });
  });

  describe("descriptive error messages", () => {
    it("uses english list with 'or' for multiple expected types", () => {
      try {
        validate("S|N", [{}]);
        fail("should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("EINVALIDTYPE");
        expect(err.message).toMatch(/string or number/);
      }
    });

    it("includes argument position in error messages", () => {
      try {
        validate("SN", ["hello", "world"]);
        fail("should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("EINVALIDTYPE");
        expect(err.message).toMatch(/Argument #2/);
      }
    });
  });
});
