
export default function exitWithCode(expectedCode, done) {
  // if a callback _expects_ an error, don't pass it to done.fail()
  const fail = done.length === 0 && done.fail || done;

  return function(err, actualCode) {
    if (err) {
      fail(err);
      return;
    }

    try {
      expect(actualCode).toBe(expectedCode);
      done();
    } catch (err) {
      fail(err);
    }
  };
}
