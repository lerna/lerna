export {};

const align = require("../wide-align");

describe("wide-align", () => {
  describe("align.left", () => {
    it("should pad a narrow string to the target width", () => {
      expect(align.left("abc", 6)).toBe("abc   ");
    });

    it("should handle wide (CJK) characters", () => {
      // "古" is 2 columns wide, so "古古" = 4 columns, needs 2 more to reach 6
      expect(align.left("古古", 6)).toBe("古古  ");
    });

    it("should handle emoji characters", () => {
      // emoji are typically 2 columns wide
      const result = align.left("😀", 4);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result).toMatch(/^😀/);
    });

    it("should return trimmed string when wider than target width", () => {
      expect(align.left("abcdef", 3)).toBe("abcdef");
    });

    it("should return trimmed string when equal to target width", () => {
      expect(align.left("abc", 3)).toBe("abc");
    });

    it("should handle empty string", () => {
      expect(align.left("", 5)).toBe("     ");
    });

    it("should trim trailing whitespace before padding", () => {
      expect(align.left("abc   ", 6)).toBe("abc   ");
    });

    it("should return original string when all whitespace and length >= width", () => {
      expect(align.left("      ", 4)).toBe("      ");
    });
  });

  describe("align.right", () => {
    it("should pad a narrow string to the target width", () => {
      expect(align.right("abc", 6)).toBe("   abc");
    });

    it("should handle wide (CJK) characters", () => {
      expect(align.right("古古", 6)).toBe("  古古");
    });

    it("should return trimmed string when wider than target width", () => {
      expect(align.right("abcdef", 3)).toBe("abcdef");
    });

    it("should return trimmed string when equal to target width", () => {
      expect(align.right("abc", 3)).toBe("abc");
    });

    it("should handle empty string", () => {
      expect(align.right("", 5)).toBe("     ");
    });

    it("should trim leading whitespace before padding", () => {
      expect(align.right("   abc", 6)).toBe("   abc");
    });

    it("should return original string when all whitespace and length >= width", () => {
      expect(align.right("      ", 4)).toBe("      ");
    });
  });

  describe("align.center", () => {
    it("should center a narrow string within the target width", () => {
      expect(align.center("abc", 7)).toBe("  abc  ");
    });

    it("should handle odd padding by putting extra space on the right", () => {
      expect(align.center("abc", 6)).toBe(" abc  ");
    });

    it("should handle wide (CJK) characters", () => {
      // "古" = 2 columns, need 4 more padding for width 6: 2 left + 2 right
      expect(align.center("古", 6)).toBe("  古  ");
    });

    it("should return trimmed string when wider than target width", () => {
      expect(align.center("abcdef", 3)).toBe("abcdef");
    });

    it("should return trimmed string when equal to target width", () => {
      expect(align.center("abc", 3)).toBe("abc");
    });

    it("should handle empty string", () => {
      expect(align.center("", 5)).toBe("     ");
    });

    it("should trim both sides before padding", () => {
      expect(align.center("  abc  ", 7)).toBe("  abc  ");
    });

    it("should return original string when all whitespace and length >= width", () => {
      expect(align.center("      ", 4)).toBe("      ");
    });
  });
});
