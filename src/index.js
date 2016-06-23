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

export const __commands__ = {
  bootstrap: BootstrapCommand,
  publish: PublishCommand,
  updated: UpdatedCommand,
  import: ImportCommand,
  clean: CleanCommand,
  diff: DiffCommand,
  init: InitCommand,
  run: RunCommand,
  exec: ExecCommand,
  ls: LsCommand
};

import PackageUtilities from "./PackageUtilities";

export const getPackagesPath = PackageUtilities.getPackagesPath;
export const getPackagePath = PackageUtilities.getPackagePath;
export const getPackageConfigPath = PackageUtilities.getPackageConfigPath;
export const getPackageConfig = PackageUtilities.getPackageConfig;
export const getPackages = PackageUtilities.getPackages;
