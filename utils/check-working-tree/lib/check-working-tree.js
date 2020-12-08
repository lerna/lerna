"use strict";

const { describeRef } = require("@lerna/describe-ref");
const { ValidationError } = require("@lerna/validation-error");
const { collectUncommitted } = require("@lerna/collect-uncommitted");

module.exports.checkWorkingTree = checkWorkingTree;
module.exports.mkThrowIfUncommitted = mkThrowIfUncommitted;
module.exports.throwIfReleased = throwIfReleased;
module.exports.throwIfUncommitted = mkThrowIfUncommitted();

function checkWorkingTree({ cwd } = {}) {
  let chain = Promise.resolve();

  chain = chain.then(() => describeRef({ cwd }));

  // wrap each test separately to allow all applicable errors to be reported
  const tests = [
    // prevent duplicate versioning
    chain.then(throwIfReleased),
    // prevent publish of uncommitted changes
    chain.then(mkThrowIfUncommitted({ cwd })),
  ];

  // passes through result of describeRef() to aid composability
  return chain.then((result) => Promise.all(tests).then(() => result));
}

function throwIfReleased({ refCount }) {
  if (refCount === "0") {
    throw new ValidationError(
      "ERELEASED",
      "The current commit has already been released. Please make new commits before continuing."
    );
  }
}

const EUNCOMMIT_MSG =
  "Working tree has uncommitted changes, please commit or remove the following changes before continuing:\n";

function mkThrowIfUncommitted(options = {}) {
  return function throwIfUncommitted({ isDirty }) {
    if (isDirty) {
      return collectUncommitted(options).then((uncommitted) => {
        throw new ValidationError("EUNCOMMIT", `${EUNCOMMIT_MSG}${uncommitted.join("\n")}`);
      });
    }
  };
}
