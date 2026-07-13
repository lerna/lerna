export {};

import * as baseTheme from "../base-theme";
vi.mock("../spin", async () => ({ default: (theme: any, spun: any) => [theme, spun] }));
vi.mock("../progress-bar", async () => ({
  default: (theme: any, width: any, completed: any) => [theme, width, completed],
}));

describe("activityIndicator", () => {
  it("no spun", () => {
    expect(baseTheme.activityIndicator({}, {}, 80)).toBeUndefined();
  });

  it("spun", () => {
    expect(baseTheme.activityIndicator({ spun: 3 }, { me: true }, 9999)).toEqual([{ me: true }, 3]);
  });
});

describe("progressBar", () => {
  it("no completion", () => {
    expect(baseTheme.progressbar({}, {}, 80)).toBeUndefined();
  });

  it("completion!", () => {
    expect(baseTheme.progressbar({ completed: 33 }, { me: true }, 100)).toEqual([{ me: true }, 100, 33]);
  });
});
