"use strict";

const inquirer = require("inquirer");
const log = require("npmlog");

exports.confirm = confirm;
exports.select = select;
exports.input = input;

/**
 * Prompt for confirmation
 * @param {string} message
 * @returns {Promise<boolean>}
 */
function confirm(message) {
  log.pause();

  return inquirer
    .prompt([
      {
        type: "expand",
        name: "confirm",
        message,
        default: 2, // default to help in order to avoid clicking straight through
        choices: [
          { key: "y", name: "Yes", value: true },
          { key: "n", name: "No", value: false },
        ],
      },
    ])
    .then((answers) => {
      log.resume();

      return answers.confirm;
    });
}

/**
 * Prompt for selection
 * @param {string} message
 * @param {{ choices: import("inquirer").ListChoiceOptions[] } & Pick<import("inquirer").Question, 'filter' | 'validate'>} [options]
 * @returns {Promise<string>}
 */
function select(message, { choices, filter, validate } = {}) {
  log.pause();

  return inquirer
    .prompt([
      {
        type: "list",
        name: "prompt",
        message,
        choices,
        pageSize: choices.length,
        filter,
        validate,
      },
    ])
    .then((answers) => {
      log.resume();

      return answers.prompt;
    });
}

/**
 * Prompt for input
 * @param {string} message
 * @param {Pick<import("inquirer").Question, 'filter' | 'validate'>} [options]
 * @returns {Promise<string>}
 */
function input(message, { filter, validate } = {}) {
  log.pause();

  return inquirer
    .prompt([
      {
        type: "input",
        name: "input",
        message,
        filter,
        validate,
      },
    ])
    .then((answers) => {
      log.resume();

      return answers.input;
    });
}
