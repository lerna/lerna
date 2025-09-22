import inquirer from "inquirer";
import log from "./npmlog";

/**
 * Prompt for confirmation
 */
export function promptConfirmation(message: string): Promise<boolean> {
  log.pause();

  return inquirer
    .prompt([
      {
        type: "expand",
        name: "confirm",
        message,
        // We put any invalid default value here to help avoid accidentally clicking straight through
        default: "2",
        choices: [
          { key: "y", name: "Yes", value: true },
          { key: "n", name: "No", value: false },
        ],
      },
    ])
    .then((answers) => {
      log.resume();

      return answers["confirm"];
    });
}

/**
 * Prompt for selection
 */
export function promptSelectOne(
  message: string,
  {
    choices,
    filter,
    validate,
  }: {
    choices?: any;
    filter?: (input: string) => string;
    validate?: (input: string) => string | boolean;
  } = {}
): Promise<string> {
  log.pause();

  return inquirer
    .prompt([
      {
        type: "list",
        name: "prompt",
        message,
        choices,
        pageSize: choices?.length,
        filter,
        validate,
      } as any,
    ])
    .then((answers) => {
      log.resume();

      return answers["prompt"];
    });
}

/**
 * Prompt for input
 */
export function promptTextInput(
  message: string,
  {
    filter,
    validate,
  }: { filter?: (input: string) => string; validate?: (input: string) => string | boolean } = {}
): Promise<string> {
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

      return answers["input"];
    });
}
