"use strict";

const log = require("npmlog");

let pulsers = 0;
let pulse;

/** @param {string} prefix */
function pulseStart(prefix) {
  pulsers += 1;

  if (pulsers > 1) {
    return;
  }

  pulse = setInterval(() => log.gauge.pulse(prefix), 150);
}

function pulseStop() {
  pulsers -= 1;

  if (pulsers > 0) {
    return;
  }

  clearInterval(pulse);
}

/**
 * Pulse progress bar until promise resolves.
 * @template {Promise} T
 * @param {string | T} prefix
 * @param {T} [promise]
 * @returns {T}
 */
function pulseTillDone(prefix, promise) {
  if (!promise) {
    /* eslint-disable no-param-reassign */
    promise = prefix;
    prefix = "";
    /* eslint-enable no-param-reassign */
  }

  pulseStart(prefix);

  return Promise.resolve(promise).then(
    (val) => {
      pulseStop();
      return val;
    },
    (err) => {
      pulseStop();
      throw err;
    }
  );
}

module.exports.pulseTillDone = pulseTillDone;
