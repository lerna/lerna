const { applyBuildMetadata } = require("../lib/build-metadata");

describe("apply-build-metadata", () => {
  it("alters version to include build metadata", () => {
    expect(applyBuildMetadata("1.0.0", "001")).toEqual("1.0.0+001");
  });

  it("does not alter version when build metadata is an empty string", () => {
    expect(applyBuildMetadata("1.0.0", "")).toEqual("1.0.0");
  });

  it("does not alter version when build metadata is null", () => {
    expect(applyBuildMetadata("1.0.0", null)).toEqual("1.0.0");
  });

  it("does not alter version when build metadata is undefined", () => {
    expect(applyBuildMetadata("1.0.0", undefined)).toEqual("1.0.0");
  });

  test.each([[" "], ["&"], ["a."], ["a. "], ["a.%"], ["a..1"]])(
    "throws error given invalid build metadata %s",
    (buildMetadata) => {
      expect(() => applyBuildMetadata("1.0.0", buildMetadata)).toThrow(
        expect.objectContaining({
          name: "ValidationError",
          message: "Build metadata does not satisfy SemVer specification.",
        })
      );
    }
  );
});
