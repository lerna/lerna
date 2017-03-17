import BootstrapCommand from "./commands/BootstrapCommand";
import PublishCommand from "./commands/PublishCommand";
import UpdatedCommand from "./commands/UpdatedCommand";
import ImportCommand from "./commands/ImportCommand";
import CleanCommand from "./commands/CleanCommand";
import DiffCommand from "./commands/DiffCommand";
import InitCommand from "./commands/InitCommand";
import RunCommand from "./commands/RunCommand";
import ExecCommand from "./commands/ExecCommand";
import LsCommand from "./commands/LsCommand";
import {exposeCommands} from "./Command";
import UpdatedPackagesCollector from "./UpdatedPackagesCollector.js";
import logger from "./logger";

export const __commands__ = exposeCommands([
  BootstrapCommand,
  PublishCommand,
  UpdatedCommand,
  ImportCommand,
  CleanCommand,
  DiffCommand,
  InitCommand,
  RunCommand,
  ExecCommand,
  LsCommand,
]);

import PackageUtilities from "./PackageUtilities";

export const getPackagesPath = PackageUtilities.getPackagesPath;
export const getPackagePath = PackageUtilities.getPackagePath;
export const getPackageConfigPath = PackageUtilities.getPackageConfigPath;
export const getPackageConfig = PackageUtilities.getPackageConfig;
export const getPackages = PackageUtilities.getPackages;
export const getUpdatedPackages = (flags = {}) => {
  logger.setLogLevel(flags.loglevel);
  const command = new UpdatedCommand([], flags);
  const updatedPackagesCollector = new UpdatedPackagesCollector(command);
  return updatedPackagesCollector.getUpdates();
};