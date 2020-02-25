/** lerna.json config file */
export interface LernaConfig extends RootAndPerCommandOptions, IgnoreChangesOption {
  /** the current version of the repository */
  version: string;

  /**
   * Per-command options.
   */
  command?: {
    bootstrap?: BootstrapCommand;
    create?: CreateCommand;
    publish?: PublishCommand;
    version?: VersionCommand;
  };

  /**
   * Array of globs to use as package locations.
   */
  packages?: string[];

  /**
   * Originally used to indicate the current version of Lerna. Made obsolete and removed in v3
   * @deprecated
   */
  lerna?: string;
}

/**
 * Commands
 */

interface Command extends RootAndPerCommandOptions {}

interface BootstrapCommand extends Command {
      /**
       * an array of globs that won't be bootstrapped when running the lerna bootstrap command.
       */
      ignore?: string;
      /**
       * array of strings that will be passed as arguments directly to npm install during the lerna bootstrap command.
       */
      npmClientArgs?: string[];
      /**
       * an array of globs that restricts which packages will be bootstrapped when running the lerna bootstrap command.
       */
      scope?: string[];
}

interface CreateCommand extends Command {
  homepage?: string;
  license?: string;
}

interface PublishCommand extends Command, VersionMessageOption, IgnoreChangesOption {
  /**
   * use it to set a custom registry url to publish to instead of npmjs.org, you must already be authenticated if
   * required.
   */
  registry?: string;
}

interface VersionCommand extends Command, VersionMessageOption {
  allowBranch?: string;
  conventionalCommits?: boolean;
  exact?: boolean;
  gitRemote?: string;
}

/*
 * Options
 *
 * Declared as interfaces, then mixed-in the `*Command` interfaces above.
 * Like JSON schema's "allOf" functionality.
 */

/** Options that are generally meaningful for every command */
interface RootAndPerCommandOptions {
  /**
   * an option to specify a specific client to run commands with (this can also be specified on a per command basis).
   * Change to "yarn" to run all commands with yarn. Defaults to "npm".
   * @default "npm"
   */
  npmClient?: 'npm' | 'yarn';
}


interface VersionMessageOption {
      /**
       *  a custom commit message when performing version updates for publication. See
       * [@lerna/version](https://github.com/lerna/lerna/tree/master/commands/version#--message-msg) for more details.
       */
      message?: string;
}

interface IgnoreChangesOption {
      /**
       * an array of globs that won't be included in lerna changed/publish. Use this to prevent publishing a new version
       * unnecessarily for changes, such as fixing a README.md typo.
       */
      ignoreChanges?: string[];
}
