import log from "../";

describe("log level display", () => {
  let actual = "";

  beforeEach(() => {
    const writeSpy = jest.spyOn(log, "write");
    writeSpy.mockImplementation((msg: any) => {
      actual += msg;
    });
  });

  afterEach(() => {
    actual = "";
    jest.clearAllMocks();
  });

  it("should set new log level display to empty string", () => {
    log.addLevel("explicitNoLevelDisplayed", 20000, {}, "");
    log.explicitNoLevelDisplayed("1", "2");
    expect(actual.trim()).toBe("1 2");

    actual = "";

    log.explicitNoLevelDisplayed("", "1");
    expect(actual.trim()).toBe("1");
  });

  it("should set new log level display to 0", () => {
    log.addLevel("explicitNoLevelDisplayed", 20000, {}, 0);
    log.explicitNoLevelDisplayed("", "1");
    expect(actual.trim()).toBe("0 1");
  });
});
