// flow-typed signature: 4658da08e95afb8459ea7ab26f919485
// flow-typed version: <<STUB>>/inquirer_v^0.12.0/flow_v0.27.0

// // @flow
//
// type Answers = {
//   [question: string]: any
// };
//
// type Separator = {
//   type: string;
//   line: string;
//   toString(): string;
// };
//
// type ChoiceOption = {
//   name?: string;
//   value?: string;
//   type?: string;
//   extra?: any;
//   key?: string;
//   checked?: boolean;
//   disabled?: string | (answers: Answers) => any;
// };
//
// type ChoiceType = string | ChoiceOption | Separator;
//
// type Question = {
//   type?: string;
//   name?: string;
//   message?: string | (answers: Answers) => string;
//   default?: any | (answers: Answers) => any;
//   choices?: Array<ChoiceType> | (answers: Answers) => Array<ChoiceType>;
//   validate?: (input: string) => boolean | string;
//   filter?: (input: string) => string;
//   when?: boolean | (answers: Answers) => boolean;
// };
//
// declare module "inquirer" {
//   declare function prompt(
//     questions: Array<Object>,
//     callback?: (answers: Answers) => any
//   ): void;
// }

// TODO: Waiting on libdef imports to be shipped to do something like:
//   import type {ThroughStream} from 'through';
//   import type {Observable} from 'rxjs';
type $todo$npm$through$ThroughStream = any;
type $todo$npm$rxjs$Observable = any;

type $npm$inquirer$Prompts = {
  [name: string]: $npm$inquirer$PromptModule
};

type $npm$inquirer$ChoiceType = string | $npm$inquirer$objects$ChoiceOption | $npm$inquirer$objects$Separator;

type $npm$inquirer$Questions = $npm$inquirer$Question | Array<$npm$inquirer$Question> | $todo$npm$rxjs$Observable<$npm$inquirer$Question>;

type $npm$inquirer$PromptModule = {
  (questions: $npm$inquirer$Questions, cb: (answers: $npm$inquirer$Answers) => any): $npm$inquirer$ui$Prompt;
  /**
   * Register a prompt type
   * @param name Prompt type name
   * @param prompt Prompt constructor
   */
  registerPrompt(name: string, prompt: $npm$inquirer$PromptModule): $npm$inquirer$ui$Prompt;
  /**
   * Register the defaults provider prompts
   */
  restoreDefaultPrompts(): void;
};

type $npm$inquirer$Question = {
  /**
   * Type of the prompt.
   * Possible values:
   * <ul>
   *      <li>input</li>
   *      <li>confirm</li>
   *      <li>list</li>
   *      <li>rawlist</li>
   *      <li>password</li>
   * </ul>
   * @defaults: 'input'
   */
  type?: string;
  /**
   * The name to use when storing the answer in the anwers hash.
   */
  name?: string;
  /**
   * The question to print. If defined as a function,
   * the first parameter will be the current inquirer session answers.
   */
  message?: string | ((answers: $npm$inquirer$Answers) => string);
  /**
   * Default value(s) to use if nothing is entered, or a function that returns the default value(s).
   * If defined as a function, the first parameter will be the current inquirer session answers.
   */
  default?: any | ((answers: $npm$inquirer$Answers) => any);
  /**
   * Choices array or a function returning a choices array. If defined as a function,
   * the first parameter will be the current inquirer session answers.
   * Array values can be simple strings, or objects containing a name (to display) and a value properties
   * (to save in the answers hash). Values can also be a Separator.
   */
  choices?: Array<$npm$inquirer$ChoiceType> | ((answers: $npm$inquirer$Answers) => Array<$npm$inquirer$ChoiceType>);
  /**
   * Receive the user input and should return true if the value is valid, and an error message (String)
   * otherwise. If false is returned, a default error message is provided.
   */
  validate?: (input: string) => boolean | string;
  /**
   * Receive the user input and return the filtered value to be used inside the program.
   * The value returned will be added to the Answers hash.
   */
  filter?: (input: string) => string;
  /**
   * Receive the current user answers hash and should return true or false depending on whether or
   * not this question should be asked. The value can also be a simple boolean.
   */
  when?: boolean | ((answers: $npm$inquirer$Answers) => boolean);
  paginated?: boolean;
};

/**
 * A key/value hash containing the client answers in each prompt.
 */
type $npm$inquirer$Answers = {
  [key: string]: string|boolean;
};

/**
 * Base interface class other can inherits from
 */
type $npm$inquirer$ui$Prompt = $npm$inquirer$ui$BaseUI<$npm$inquirer$Prompts> & {
  new(promptModule: $npm$inquirer$Prompts): $npm$inquirer$ui$Prompt;
  /**
   * Once all prompt are over
   */
  onCompletion(): void;
  processQuestion(question: $npm$inquirer$Question): any;
  fetchAnswer(question: $npm$inquirer$Question): any;
  setDefaultType(question: $npm$inquirer$Question): any;
  filterIfRunnable(question: $npm$inquirer$Question): any;
};

/**
 * Sticky bottom bar user interface
 */
type $npm$inquirer$ui$BottomBar = $npm$inquirer$ui$BaseUI<$npm$inquirer$ui$BottomBarOption> & {
  new(opt?: $npm$inquirer$ui$BottomBarOption): $npm$inquirer$ui$BottomBar;
  /**
   * Render the prompt to screen
   * @return self
   */
  render(): $npm$inquirer$ui$BottomBar;
  /**
   * Update the bottom bar content and rerender
   * @param bottomBar Bottom bar content
   * @return self
   */
  updateBottomBar(bottomBar: string): $npm$inquirer$ui$BottomBar;
  /**
   * Rerender the prompt
   * @return self
   */
  writeLog(data: any): $npm$inquirer$ui$BottomBar;
  /**
   * Make sure line end on a line feed
   * @param str Input string
   * @return The input string with a final line feed
   */
  enforceLF(str: string): string;
  /**
   * Helper for writing message in Prompt
   * @param message The message to be output
   */
  write(message: string): void;
  log: $todo$npm$through$ThroughStream;
};

type $npm$inquirer$ui$BottomBarOption = {
  bottomBar?: string;
};

/**
 * Base interface class other can inherits from
 */
type $npm$inquirer$ui$BaseUI<TOpt> = {
  new(opt: TOpt): void;
  /**
   * Handle the ^C exit
   * @return {null}
   */
  onForceClose(): void;
  /**
   * Close the interface and cleanup listeners
   */
  close(): void;
  /**
   * Handle and propagate keypress events
   */
  onKeypress(s: string, key: $npm$inquirer$ui$Key): void;
};

type $npm$inquirer$ui$Key = {
  sequence: string;
  name: string;
  meta: boolean;
  shift: boolean;
  ctrl: boolean;
};

/**
 * Choice object
 * Normalize input as choice object
 * @constructor
 * @param {String|Object} val  Choice value. If an object is passed, it should contains
 *                             at least one of `value` or `name` property
 */
type $npm$inquirer$objects$Choice = {
  new(str: string): $npm$inquirer$objects$Choice;
  new(separator: $npm$inquirer$objects$Separator): $npm$inquirer$objects$Choice;
  new(option: $npm$inquirer$objects$ChoiceOption): $npm$inquirer$objects$Choice;
};

type $npm$inquirer$objects$ChoiceOption = {
  name?: string;
  value?: string | boolean;
  type?: string;
  extra?: any;
  key?: string;
  checked?: boolean;
  disabled?: string | (answers: $npm$inquirer$Answers) => any;
};

/**
 * Choices collection
 * Collection of multiple `choice` object
 * @constructor
 * @param choices  All `choice` to keep in the collection
 */
type $npm$inquirer$objects$Choices = {
  new(choices: Array<string | $npm$inquirer$objects$Separator | $npm$inquirer$objects$ChoiceOption>, answers?: $npm$inquirer$Answers): $npm$inquirer$objects$Choices;
  choices: Array<$npm$inquirer$objects$Choice>;
  realChoices: Array<$npm$inquirer$objects$Choice>;
  length: number;
  realLength: number;
  /**
   * Get a valid choice from the collection
   * @param selector The selected choice index
   * @return Return the matched choice or undefined
   */
  getChoice(selector: number): $npm$inquirer$objects$Choice;
  /**
   * Get a raw element from the collection
   * @param selector The selected index value
   * @return Return the matched choice or undefined
   */
  get(selector: number): $npm$inquirer$objects$Choice;
  /**
   * Match the valid choices against a where clause
   * @param whereClause Lodash `where` clause
   * @return Matching choices or empty array
   */
  where(whereClause: Object): Array<$npm$inquirer$objects$Choice>;
  /**
   * Pluck a particular key from the choices
   * @param propertyName Property name to select
   * @return Selected properties
   */
  pluck(propertyName: string): Array<any>;
  forEach<T>(application: (choice: $npm$inquirer$objects$Choice) => T): Array<T>;
};

type $npm$inquirer$objects$SeparatorStatic = {
  /**
   * @param line Separation line content (facultative)
   */
  new(line?: string): $npm$inquirer$objects$Separator;
  /**
   * Helper function returning false if object is a separator
   * @param obj object to test against
   * @return `false` if object is a separator
   */
  exclude(obj: any): boolean;
};

/**
 * Separator object
 * Used to space/separate choices group
 * @constructor
 * @param {String} line   Separation line content (facultative)
 */
type $npm$inquirer$objects$Separator = {
  type: string;
  line: string;
  /**
   * Stringify separator
   * @return {String} the separator display string
   */
  toString(): string;
};

declare module 'inquirer' {
  declare type Prompts = $npm$inquirer$Prompts;
  declare type ChoiceType = $npm$inquirer$ChoiceType;
  declare type Questions = $npm$inquirer$Questions;
  declare type PromptModule = $npm$inquirer$PromptModule;

  declare type Question = $npm$inquirer$Question;
  declare type Answers = $npm$inquirer$Answers;

  declare type Choice = $npm$inquirer$objects$Choice;
  declare type ChoiceOption = $npm$inquirer$objects$ChoiceOption;
  declare type Choices = $npm$inquirer$objects$Choices;

  // TODO: What to do with these types... (since `Separator` uses the same name as an exported var which has a type of `SeparatorStatic`)
  // declare type SeparatorStatic = $npm$inquirer$objects$SeparatorStatic;
  // declare type Separator = $npm$inquirer$objects$Separator;

  declare function restoreDefaultPrompts(): void;

  /**
   * Expose helper functions on the top level for easiest usage by common users
   * @param name
   * @param prompt
   */
  declare function registerPrompt(name: string, prompt: $npm$inquirer$PromptModule): void;

  /**
   * Create a new self-contained prompt module.
   */
  declare function createPromptModule(): $npm$inquirer$PromptModule;

  /**
   * Public CLI helper interface
   * @param questions Questions settings array
   * @param cb Callback being passed the user answers
   * @return
   */
  declare function prompt(questions: $npm$inquirer$Questions, cb?: (answers: $npm$inquirer$Answers) => any): $npm$inquirer$ui$Prompt;
  declare var prompts: $npm$inquirer$Prompts;
  declare var Separator: $npm$inquirer$objects$SeparatorStatic;
  declare var ui: {
    BottomBar: $npm$inquirer$ui$BottomBar,
    Prompt: $npm$inquirer$ui$Prompt
  };
}
