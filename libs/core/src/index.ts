export { addDependencies } from "./lib/add-dependencies";
export { addDependents } from "./lib/add-dependents";
export { checkWorkingTree, throwIfUncommitted } from "./lib/check-working-tree";
export * from "./lib/cli";
export {
  collectProjects,
  collectProjectUpdates,
  ProjectCollectorOptions,
  ProjectUpdateCollectorOptions,
} from "./lib/collect-updates";
export { Command } from "./lib/command";
export { applyBuildMetadata, recommendVersion, updateChangelog } from "./lib/conventional-commits";
export { describeRef, describeRefSync } from "./lib/describe-ref";
export { filterOptions, FilterOptions } from "./lib/filter-options";
export { filterProjects } from "./lib/filter-projects";
export { getPackageManifestPath } from "./lib/get-package-manifest-path";
export * from "./lib/get-packages-for-option";
export { hasNpmVersion } from "./lib/has-npm-version";
export { listableFormatProjects } from "./lib/listable-format-projects";
export { listableOptions, ListableOptions } from "./lib/listable-options";
export { logPacked } from "./lib/log-packed";
export { Conf } from "./lib/npm-conf/conf";
export { npmInstall, npmInstallDependencies } from "./lib/npm-install";
export { npmPublish } from "./lib/npm-publish";
export { npmRunScript, npmRunScriptStreaming } from "./lib/npm-run-script";
export { getOneTimePassword } from "./lib/otplease";
export { output } from "./lib/output";
export { packDirectory, Packed } from "./lib/pack-directory";
export { ExtendedNpaResult, Package, RawManifest } from "./lib/package";
export { prereleaseIdFromVersion } from "./lib/prerelease-id-from-version";
export { generateProfileOutputPath, Profiler } from "./lib/profiler";
export { CommandConfigOptions, getPackages, Project } from "./lib/project";
export {
  getPackage,
  isExternalNpmDependency,
  ProjectGraphProjectNodeWithPackage,
  ProjectGraphWithPackages,
  ProjectGraphWorkspacePackageDependency,
} from "./lib/project-graph-with-packages";
export { promptConfirmation, promptSelectOne, promptTextInput } from "./lib/prompt";
export { pulseTillDone } from "./lib/pulse-till-done";
export { rimrafDir } from "./lib/rimraf-dir";
export { createRunner, runLifecycle } from "./lib/run-lifecycle";
export { runProjectsTopologically } from "./lib/run-projects-topologically";
export { createGitHubClient, createGitLabClient, parseGitRepo } from "./lib/scm-clients";
export { default as tempWrite } from "./lib/temp-write";
export { timer } from "./lib/timer";
export { toposortProjects } from "./lib/toposort-projects";
export { ValidationError } from "./lib/validation-error";
export { npmConf, npmDistTag };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const npmConf = require("./lib/npm-conf");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const npmDistTag = require("./lib/npm-dist-tag");
