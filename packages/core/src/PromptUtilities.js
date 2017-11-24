import inquirer from "inquirer";
import log from "npmlog";

export default class PromptUtilities {
  static confirm(message, callback) {
    log.pause();
    inquirer.prompt([{
      type: "expand",
      name: "confirm",
      message: message,
      default: 2, // default to help in order to avoid clicking straight through
      choices: [
        { key: "y", name: "Yes", value: true },
        { key: "n", name: "No",  value: false }
      ]
    }]).then((answers) => {
      log.resume();
      callback(answers.confirm);
    });
  }

  static select(message, { choices, filter, validate } = {}, callback) {
    log.pause();
    inquirer.prompt([{
      type: "list",
      name: "prompt",
      message: message,
      choices: choices,
      pageSize: choices.length,
      filter: filter,
      validate: validate
    }]).then((answers) => {
      log.resume();
      callback(answers.prompt);
    });
  }

  static input(message, { filter, validate } = {}, callback) {
    log.pause();
    inquirer.prompt([{
      type: "input",
      name: "input",
      message: message,
      filter: filter,
      validate: validate
    }]).then((answers) => {
      log.resume();
      callback(answers.input);
    });
  }
}
