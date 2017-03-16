import assert from "assert";

export default function exitWithCode(expectedCode, done) {
  return function(err, actualCode) {
    if (err) {
      done(err);
      return;
    }

    try {
      assert.equal(actualCode, expectedCode);
      done();
    } catch (err) {
      done(err);
    }
  };
}
