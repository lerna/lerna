"use strict";

const command = require("../command");
const yargs = require("yargs");

describe("command", () => {
  describe("otp-rate-limit-delay", () => {
    it("default value is -1.", () => {
      const parsed = yargs.command("temp", "", yg => command.builder(yg)).parse(["temp"]);
      expect(parsed).toBeDefined();
      expect(parsed).toHaveProperty("otp-rate-limit-delay", -1);
      expect(parsed).toHaveProperty("otpRateLimitDelay", -1);
    });
    it("value from command line appropriately overrides", () => {
      const parsed = yargs
        .command("temp", "", yg => command.builder(yg))
        .parse(["temp", "--otp-rate-limit-delay", "10"]);
      expect(parsed).toBeDefined();
      expect(parsed).toHaveProperty("otp-rate-limit-delay", 10);
      expect(parsed).toHaveProperty("otpRateLimitDelay", 10);
    });
  });
});
