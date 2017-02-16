import BootstrapCommand from "./commands/BootstrapCommand";
import PublishCommand from "./commands/PublishCommand";
import UpdatedCommand from "./commands/UpdatedCommand";
import ImportCommand from "./commands/ImportCommand";
import OwnerCommand from "./commands/OwnerCommand";
import CleanCommand from "./commands/CleanCommand";
import DiffCommand from "./commands/DiffCommand";
import InitCommand from "./commands/InitCommand";
import ExecCommand from "./commands/ExecCommand";
import RunCommand from "./commands/RunCommand";
import LsCommand from "./commands/LsCommand";
import {exposeCommands} from "./Command";

export const __commands__ = exposeCommands([
  BootstrapCommand,
  PublishCommand,
  UpdatedCommand,
  ImportCommand,
  OwnerCommand,
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
