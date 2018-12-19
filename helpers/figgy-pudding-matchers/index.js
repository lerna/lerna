"use strict";

const diff = require("jest-diff");
const {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  ensureNoExpected,
  matcherHint,
  printExpected,
  printReceived,
  printWithType,
} = require("jest-matcher-utils");
const { equals } = require("expect/build/jasmine_utils");

/**
 * Jest matchers for figgy-pudding instances
 *
 *    expect.extend(require("@lerna-test/figgy-pudding-matchers"))
 */
exports.toBeFiggyPudding = toBeFiggyPudding;
exports.toHaveFiggyPudding = toHaveFiggyPudding;
exports.figgyPudding = figgyPudding;

// expect(foo).toBeFiggyPudding();
function toBeFiggyPudding(received, expected) {
  ensureNoExpected(expected, ".toBeFiggyPudding");

  return {
    pass: isFiggyInstance(received),
    message: () =>
      `${matcherHint(".toBeFiggyPudding", "received", "", {
        isNot: this.isNot,
      })}\n\nReceived: ${printReceived(received)}`,
  };
}

// expect(foo).toHaveFiggyPudding({ ...spec });
function toHaveFiggyPudding(received, expected) {
  if (!isFiggyInstance(received)) {
    throw new Error(
      `${matcherHint("[.not].toHaveFiggyPudding", "object", "expected")}\n\n` +
        `${RECEIVED_COLOR("received")} value must be a FiggyPudding instance.\n${printWithType(
          "Received",
          received,
          printReceived
        )}`
    );
  }

  if (!isObjectWithKeys(expected)) {
    throw new Error(
      `${matcherHint("[.not].toHaveFiggyPudding", "object", "expected")}\n\n` +
        `${EXPECTED_COLOR("expected")} value must be an object.\n${printWithType(
          "Expected",
          expected,
          printExpected
        )}`
    );
  }

  const pass = hasEveryMatchingProperty(received, expected);
  const message = pass
    ? () =>
        `${matcherHint(".not.toHaveFiggyPudding")}\n\n` +
        `Expected pudding to not contain:\n` +
        `  ${printExpected(expected)}\n` +
        `Received:\n` +
        `  ${printReceived(received.toJSON())}`
    : () => {
        const figgyObj = received.toJSON();
        const diffString = diff(expected, figgyObj, {
          expand: this.expand,
        });

        return (
          `${matcherHint(".toHaveFiggyPudding")}\n\n` +
          `Expected pudding to contain:\n` +
          `  ${printExpected(expected)}\n` +
          `Received:\n` +
          `  ${printReceived(figgyObj)}${diffString ? `\n\nDifference:\n\n${diffString}` : ""}`
        );
      };

  return {
    actual: received,
    expected,
    message,
    pass,
  };
}

// expect.figgyPudding({ ...spec });
function figgyPudding(received, expected) {
  // an asymmetric matcher does not have access to `this`
  const pass = hasEveryMatchingProperty(received, expected);
  // the message is never called for .toHaveBeenCalledWith() et al.
  const message = pass
    ? () =>
        `${matcherHint(".not.figgyPudding", undefined, undefined, {
          isDirectExpectCall: true,
        })}\n\n` +
        `Expected pudding to not contain:\n` +
        `  ${printExpected(expected)}\n` +
        `Received:\n` +
        `  ${printReceived(received.toJSON())}`
    : () => {
        const figgyObj = received.toJSON();
        const diffString = diff(expected, figgyObj, {
          expand: this.expand,
        });

        return (
          `${matcherHint(".figgyPudding", undefined, undefined, {
            isDirectExpectCall: true,
          })}\n\n` +
          `Expected pudding to contain:\n` +
          `  ${printExpected(expected)}\n` +
          `Received:\n` +
          `  ${printReceived(figgyObj)}${diffString ? `\n\nDifference:\n\n${diffString}` : ""}`
        );
      };

  return { message, pass };
}

function isObjectWithKeys(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    !(obj instanceof Error) &&
    !(obj instanceof Array) &&
    !(obj instanceof Date)
  );
}

function hasEveryMatchingProperty(received, expected) {
  return Object.keys(expected).every(property => equals(received[property], expected[property]));
}

function isFiggyInstance(received) {
  return hasEveryMatchingProperty(received, { __isFiggyPudding: true });
}
