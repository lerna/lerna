"use strict";

const dedent = require("dedent");

module.exports = notSatisfiedMessage;

function notSatisfiedMessage(unsatisfied) {
  return dedent`
    Requested range not satisfiable:
    ${unsatisfied.map(u => `${u.name}@${u.versionRange} (available: ${u.version})`).join(", ")}
  `;
}
