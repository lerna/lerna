import inquirer from "inquirer";
import log from "npmlog";

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

type PromptSelectOneOptions = Partial<
  {
    choices: inquirer.ListChoiceOptions[];
  } & Pick<inquirer.Question, "filter" | "validate">
>;

/**
 * Prompt for selection
 */
export function promptSelectOne(
  message: string,
  { choices, filter, validate }: PromptSelectOneOptions = {}
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
      },
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
  { filter, validate }: Pick<inquirer.Question, "filter" | "validate"> = {}
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

      return answers.input;
    });
}
