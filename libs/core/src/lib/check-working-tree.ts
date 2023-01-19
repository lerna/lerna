// TODO: refactor based on TS feedback
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { collectUncommitted } from "./collect-uncommitted";
import { describeRef } from "./describe-ref";
import { ValidationError } from "./validation-error";

export function checkWorkingTree({ cwd } = {}) {
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

export function throwIfReleased({ refCount }) {
  if (refCount === "0") {
    throw new ValidationError(
      "ERELEASED",
      "The current commit has already been released. Please make new commits before continuing."
    );
  }
}

const EUNCOMMIT_MSG =
  "Working tree has uncommitted changes, please commit or remove the following changes before continuing:\n";

export function mkThrowIfUncommitted(options = {}) {
  return function throwIfUncommitted({ isDirty }) {
    if (isDirty) {
      return collectUncommitted(options).then((uncommitted) => {
        throw new ValidationError("EUNCOMMIT", `${EUNCOMMIT_MSG}${uncommitted.join("\n")}`);
      });
    }
  };
}

export const throwIfUncommitted = mkThrowIfUncommitted();
