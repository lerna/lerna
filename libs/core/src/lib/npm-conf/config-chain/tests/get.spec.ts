// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

const cc = require("../index");

test("chain load event", (done) => {
  const chain = cc();
  const name = "forFun";

  chain
    .add(
      {
        __sample: "for fun only",
      },
      name
    )
    .on("load", function () {
      // Test that chain.get("__sample", name) returns "for fun only"
      expect(chain.get("__sample", name)).toBe("for fun only");

      done();
    });
});
