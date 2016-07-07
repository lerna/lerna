// @flow

import inquirer from "inquirer";

export default class PromptUtilities {
  static confirm(message: string, callback: (confirmed: boolean) => mixed) {
    inquirer.prompt([{
      type: "expand",
      name: "confirm",
      message: message,
      default: 2, // default to help in order to avoid clicking straight through
      choices: [
        { key: "y", name: "Yes", value: true },
        { key: "n", name: "No",  value: false }
      ]
    }], (answers: { confirm: any }) => {
      callback((answers.confirm: boolean));
    });
  }

  static select(message: string, {choices, filter, validate} = {}, callback: (choice: any) => mixed) {
    inquirer.prompt([{
      type: "list",
      name: "prompt",
      message: message,
      choices: choices,
      filter: filter,
      validate: validate
    }], (answers) => {
      callback(answers.prompt);
    });
  }

  static input(message: string, {filter, validate} = {}, callback: (input: string) => mixed) {
    inquirer.prompt([{
      type: "input",
      name: "input",
      message: message,
      filter: filter,
      validate: validate
    }], (answers: { input: any }) => {
      callback((answers.input: string));
    });
  }
}
