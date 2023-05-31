/**
 * Prior to v7, lerna has some runtime config coercion logic called deprecate-config.ts
 * but that can lead to confusing behavior, so we removed it.
 *
 * Given we can implement the following lerna repair generator, we still offer users an
 * easy way to deal with their outdated config.
 */

import { formatFiles, readJson, Tree, writeJson } from "@nx/devkit";

interface LernaJson {
  command: {
    [key: string]: Record<string, unknown>;
  };
}

export default async function generator(tree: Tree) {
  const lernaJson = readJson(tree, "lerna.json");

  // Migrate commands -> command first, so that subsequent migrations can assume the consistent structure
  if (lernaJson.commands) {
    lernaJson.command = {
      ...lernaJson.commands,
      // Prefer already correctly named config when merging
      ...lernaJson.command,
    };
    delete lernaJson.commands;
  }

  updateIncludeFilteredDependencies(lernaJson);
  updateIncludeFilteredDependents(lernaJson);
  updateGithubRelease(lernaJson);
  updateLegacyVersionOptions(lernaJson);

  writeJson(tree, "lerna.json", lernaJson);

  await formatFiles(tree);
}

function updateIncludeFilteredDependencies(json: LernaJson) {
  const commandsToCheck = ["add", "bootstrap", "clean", "list", "run", "exec"];
  for (const command of commandsToCheck) {
    if (json.command?.[command]?.["includeFilteredDependencies"] !== undefined) {
      json.command[command]["includeDependencies"] = json.command?.[command]?.["includeFilteredDependencies"];
      delete json.command[command]["includeFilteredDependencies"];
    }
  }
}

function updateIncludeFilteredDependents(json: LernaJson) {
  const commandsToCheck = ["add", "bootstrap", "clean", "list", "run", "exec"];
  for (const command of commandsToCheck) {
    if (json.command?.[command]?.["includeFilteredDependents"] !== undefined) {
      json.command[command]["includeDependents"] = json.command?.[command]?.["includeFilteredDependents"];
      delete json.command[command]["includeFilteredDependents"];
    }
  }
}

function updateGithubRelease(json: LernaJson) {
  const commandsToCheck = ["version", "publish"];
  for (const command of commandsToCheck) {
    if (json.command?.[command]?.["githubRelease"] === true) {
      json.command[command]["createRelease"] = "github";
    }
    // Always remove the old config because an old falsely value would have no meaning
    delete json.command?.[command]?.["githubRelease"];
  }
}

function updateLegacyVersionOptions(json: LernaJson) {
  const commandsToCheck = ["version", "publish"];
  for (const command of commandsToCheck) {
    if (json.command?.[command]?.["skipGit"] === true) {
      json.command[command]["push"] = false;
      json.command[command]["gitTagVersion"] = false;
    }
    // Always remove the old config because an old falsely value would have no meaning
    delete json.command?.[command]?.["skipGit"];

    if (json.command?.[command]?.["repoVersion"]) {
      json.command[command]["bump"] = json.command[command]["repoVersion"];
    }
    // Always remove the old config because an old falsely value would have no meaning
    delete json.command?.[command]?.["repoVersion"];

    if (json.command?.[command]?.["cdVersion"]) {
      json.command[command]["bump"] = json.command[command]["cdVersion"];
    }
    // Always remove the old config because an old falsely value would have no meaning
    delete json.command?.[command]?.["cdVersion"];

    if (json.command?.[command]?.["npmTag"]) {
      json.command[command]["distTag"] = json.command[command]["npmTag"];
    }
    // Always remove the old config because an old falsely value would have no meaning
    delete json.command?.[command]?.["npmTag"];

    if (json.command?.[command]?.["ignore"]) {
      json.command[command]["ignoreChanges"] = json.command[command]["ignore"];
    }
    // Always remove the old config because an old falsely value would have no meaning
    delete json.command?.[command]?.["ignore"];
  }
}
