"use strict";

const inquirer = require("inquirer");
const log = require("npmlog");

exports.confirm = confirm;
exports.select = select;
exports.input = input;

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
    .then(answers => {
      log.resume();

      return answers.confirm;
    });
}

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
    .then(answers => {
      log.resume();

      return answers.prompt;
    });
}

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
    .then(answers => {
      log.resume();

      return answers.input;
    });
}
