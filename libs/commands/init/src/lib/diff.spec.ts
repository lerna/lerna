import { diff } from "./diff";

describe("diff", () => {
  // The exact options lerna init passes when printing dry-run diffs, with
  // every color pinned so comparisons don't depend on chalk's color detection.
  const initCommandOptions = {
    omitAnnotationLines: true,
    contextLines: 1,
    expand: false,
    aColor: (s: string) => `<red>${s}</red>`,
    bColor: (s: string) => `<green>${s}</green>`,
    commonColor: (s: string) => s,
    patchColor: () => "",
  };

  it("reports no visual difference for identical inputs", () => {
    expect(diff("a\nb", "a\nb")).toBe("Compared values have no visual difference.");
  });

  it("renders a full-file insert (CREATE preview) without a patch mark", () => {
    const after = ["{", '  "version": "0.0.0"', "}"].join("\n");
    expect(diff("", after, initCommandOptions)).toBe(
      ["<green>+ {</green>", '<green>+   "version": "0.0.0"</green>', "<green>+ }</green>"].join("\n")
    );
  });

  it("renders an update with context and hunk separators (UPDATE preview)", () => {
    const before = ["{", '  "name": "root",', '  "version": "1.0.0",', '  "private": true', "}"].join("\n");
    const after = ["{", '  "name": "root",', '  "version": "2.0.0",', '  "private": true', "}"].join("\n");
    expect(diff(before, after, initCommandOptions)).toBe(
      [
        "", // patch mark for the skipped first line, blanked by patchColor
        '    "name": "root",',
        '<red>-   "version": "1.0.0",</red>',
        '<green>+   "version": "2.0.0",</green>',
        '    "private": true',
      ].join("\n")
    );
  });

  it("separates distant changes into multiple hunks", () => {
    const before = ["a", "b", "c", "d", "e", "f", "g"].join("\n");
    const after = ["A", "b", "c", "d", "e", "f", "G"].join("\n");
    const result = diff(before, after, initCommandOptions);
    expect(result).toBe(
      [
        "", // patch mark for the first hunk, blanked by patchColor
        "<red>- a</red>",
        "<green>+ A</green>",
        "  b",
        "", // patch mark separating the hunks, blanked by patchColor
        "  f",
        "<red>- g</red>",
        "<green>+ G</green>",
      ].join("\n")
    );
  });

  it("expands all lines when expand is true (default)", () => {
    expect(diff("a\nb\nc", "a\nx\nc")).toBe(["  a", "- b", "+ x", "  c"].join("\n"));
  });

  it("renders empty changed lines without trailing whitespace", () => {
    expect(diff("a\n\nb", "a\nb")).toBe(["  a", "-", "  b"].join("\n"));
  });
});
