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
    .then((answers) => answers["confirm"])
    .finally(() => log.resume());
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
        type: "select",
        name: "prompt",
        message,
        choices,
        pageSize: choices?.length,
        filter,
        validate,
      },
    ])
    .then((answers) => answers["prompt"])
    .finally(() => log.resume());
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
    .then((answers) => answers["input"])
    .finally(() => log.resume());
}
