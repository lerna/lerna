/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-var-requires */

import log from "../";

const Progress = require("are-we-there-yet");

let actions: any[] = [];

function recursiveMatch(actual: any, expected: any, desc: string) {
  if (expected instanceof RegExp) {
    expect(actual).toMatch(expected);
  } else if (typeof expected === "boolean") {
    expect(!!actual).toBe(expected);
  } else if (typeof expected !== "object" || expected == null) {
    expect(actual).toBe(expected);
  } else {
    if (actual == null) {
      actual = {};
    }
    Object.keys(expected).forEach((key) => {
      recursiveMatch(actual[key], expected[key], desc + ":" + key);
    });
    if (Array.isArray(actual)) {
      expect(actual.length).toBe(expected.length);
    } else {
      Object.keys(actual).forEach((key) => {
        if (expected[key] == null) {
          throw new Error(desc + ":" + key + " should not be set");
        }
      });
    }
  }
}

function didActions(msg: string, output: any) {
  expect(actions.length).toBe(output.length);

  for (let cmd = 0; cmd < output.length; ++cmd) {
    recursiveMatch(actions[cmd], output[cmd], msg + ":" + output[cmd][0]);
  }

  actions = [];
}

describe("log module", () => {
  beforeEach(() => {
    // Reset log.gauge to a new instance to avoid state leak between tests
    log.gauge = {
      enabled: false,
      enable() {
        this.enabled = true;
        actions.push(["enable"]);
      },
      disable() {
        this.enabled = false;
        actions.push(["disable"]);
      },
      isEnabled() {
        return this.enabled;
      },
      hide() {
        actions.push(["hide"]);
      },
      show() {
        actions.push(["show"].concat(Array.prototype.slice.call(arguments)));
      },
      pulse(name: any) {
        actions.push(["pulse", name]);
      },
    };

    // In the original implementation, the tests were performed using tap which does not set color, so force disable it in jest too to keep assertions consistent
    log.useColor = () => false;
    log.disableProgress();
    log.resume();
    log.tracker = new Progress.TrackerGroup();
    log.enableProgress();
    actions = [];
  });

  afterEach(() => {
    actions = [];
  });

  it("enableProgress", () => {
    log.disableProgress();
    actions = [];
    log.enableProgress();
    didActions("enableProgress", [["enable"]]);
    log.enableProgress();
    didActions("enableProgress again", []);
  });

  it("disableProgress", () => {
    log.disableProgress();
    didActions("disableProgress", [["disable"]]);
    log.disableProgress();
    didActions("disableProgress again", []);
  });

  it("showProgress", () => {
    log.disableProgress();
    actions = [];
    log.showProgress("foo");
    didActions("showProgress disabled", []);
    log.enableProgress();
    actions = [];
    log.showProgress("foo");
    didActions("showProgress", [["show", { section: "foo", completed: 0 }]]);
    actions = [];
    // @ts-expect-error ...
    log.log("info", undefined, "foo");
    actions = [];
    log.showProgress("foo");
    didActions("showProgress", [
      ["show", { section: "foo", subsection: "", completed: 0, logline: "info foo" }],
    ]);
    log.record.length = 0;
  });

  it("clearProgress", () => {
    log.clearProgress();
    didActions("clearProgress", [["hide"]]);
    log.disableProgress();
    actions = [];
    log.clearProgress();
    didActions("clearProgress disabled", []);
    actions = [];
    log.clearProgress(() => {
      expect(true).toBe(true);
    });
    didActions("clearProgress disabled", []);
  });

  it("newItem", () => {
    actions = [];
    const a = log.newItem("test", 10);
    didActions("newItem", [
      [
        "show",
        {
          section: "test",
          completed: 0,
          subsection: false,
          logline: false,
        },
      ],
    ]);
    a.completeWork(5);
    didActions("newItem:completeWork", [
      [
        "show",
        {
          section: "test",
          completed: 0.5,
          subsection: false,
          logline: false,
        },
      ],
    ]);
    a.finish();
    didActions("newItem:finish", [
      [
        "show",
        {
          section: "test",
          completed: 1,
          subsection: false,
          logline: false,
        },
      ],
    ]);
  });

  it("newGroup", () => {
    const a = log.newGroup("newGroup");
    didActions("newGroup", [
      [
        "show",
        {
          section: "newGroup",
          completed: 0,
          subsection: false,
          logline: false,
        },
      ],
    ]);
    a.warn("test", "this is a test");
    didActions("newGroup:warn", [
      ["pulse", "test"],
      ["hide"],
      [
        "show",
        {
          subsection: "test",
          logline: /this is a test$/,
          completed: 0,
        },
      ],
    ]);
    const b = a.newItem("newGroup2", 10);
    didActions("newGroup:newItem", [
      [
        "show",
        {
          section: "newGroup2",
          completed: 0,
          subsection: true,
          logline: true,
        },
      ],
    ]);
    b.completeWork(5);
    didActions("newGroup:completeWork", [
      [
        "show",
        {
          section: "newGroup2",
          completed: 0.5,
          subsection: true,
          logline: true,
        },
      ],
    ]);
    a.finish();
    didActions("newGroup:finish", [
      [
        "show",
        {
          section: "newGroup",
          completed: 1,
          subsection: true,
          logline: true,
        },
      ],
    ]);
  });

  it("newStream", () => {
    const a = log.newStream("newStream", 10);
    didActions("newStream", [
      [
        "show",
        {
          completed: 0,
          section: "newStream",
          subsection: true,
          logline: true,
        },
      ],
    ]);
    a.write("abcde");
    didActions("newStream", [
      [
        "show",
        {
          completed: 0.5,
          section: "newStream",
          subsection: true,
          logline: true,
        },
      ],
    ]);
    a.write("fghij");
    didActions("newStream", [
      [
        "show",
        {
          completed: 1,
          section: "newStream",
          subsection: true,
          logline: true,
        },
      ],
    ]);
    expect(log.tracker.completed()).toBe(1); // Overall completion
  });

  it("enableProgress while paused", () => {
    log.disableProgress();
    actions = [];
    log.pause();
    log.enableProgress();
    didActions("enableProgress", []);
    log.enableProgress();
    didActions("enableProgress again", []);
  });

  it("pause while enableProgress", () => {
    log.disableProgress();
    actions = [];
    log.enableProgress();
    log.pause();
    didActions("enableProgress", [["enable"], ["disable"]]);
    log.resume();
    didActions("enableProgress", [["enable"]]);
  });
});
