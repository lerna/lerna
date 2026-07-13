// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { afterEach, vi } from "vitest";

// Everything that is not explicitly re-exported below falls through to the real
// @lerna/core: spec files spread the actual module before these mocks when
// registering the module mock, e.g.
//   vi.mock("@lerna/core", async () => ({
//     ...(await vi.importActual("@lerna/core")),
//     ...(await import("@lerna/test-helpers/__mocks__/@lerna/core")),
//   }));
export { checkWorkingTree, throwIfReleased, throwIfUncommitted } from "./check-working-tree";
export { collectProjectUpdates, collectProjects } from "./collect-project-updates";
export { recommendVersion, updateChangelog } from "./conventional-commits";
export { createGitHubClient, parseGitRepo } from "./github-client";
export { createGitLabClient } from "./gitlab-client";
export { hasNpmVersion } from "./has-npm-version";
export * as npmDistTag from "./npm-dist-tag";
export { npmPublish } from "./npm-publish";
export { output } from "./output";
export { packDirectory } from "./pack-directory";
// Note: promptConfirmation from ./prompt is deliberately NOT re-exported; it is
// replaced with a plain mock below, preserving the historical override order of
// this module's exports.
export { promptSelectOne, promptTextInput } from "./prompt";
export { runLifecycle, createRunner } from "./run-lifecycle";

// writePackage mock: intercepts Package.prototype.serialize to record
// what was written, exposing updatedVersions() and updatedManifest() helpers.
const realCore = await vi.importActual("@lerna/core");

const registry = new Map();
const origSerialize = realCore.Package.prototype.serialize;

realCore.Package.prototype.serialize = function () {
  const json = this.toJSON();
  registry.set(json.name, json);
  return origSerialize.call(this);
};

export const writePackage: any = Object.assign(vi.fn(), {
  registry,
  updatedManifest: (name: string) => registry.get(name),
  updatedVersions: () => {
    const result: Record<string, string> = {};
    registry.forEach((pkg: any, name: string) => {
      result[name] = pkg.version;
    });
    return result;
  },
});

afterEach(() => {
  registry.clear();
});

export const npmRunScript = vi.fn();
export const npmRunScriptStreaming = vi.fn();
export const promptConfirmation = vi.fn();
export const rimrafDir = vi.fn();
export const npmInstall = vi.fn();
export const npmInstallDependencies = vi.fn();
export const getOneTimePassword = vi.fn();
export const gitCheckout = vi.fn();
