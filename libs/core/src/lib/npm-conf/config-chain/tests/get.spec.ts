// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import cc from "../index";

// vitest does not support jest's done-callback signature; adapt callback-style
// tests by wrapping them in a promise.
function testDone(name: string, fn: (done: () => void) => void) {
  test(name, () => new Promise<void>((resolve) => fn(resolve)));
}

testDone("chain load event", (done) => {
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
