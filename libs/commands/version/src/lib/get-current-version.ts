import { ValidationError } from "@lerna/core";
import execa, { ExecaReturnValue } from "execa";

interface DistTagsResponse {
  [key: string]: string;
}

export async function getCurrentVersion(packageName: string, distTag: string): Promise<string> {
  let result: ExecaReturnValue<string>;
  try {
    result = await execa("npm", ["view", packageName, "dist-tags", "--json"]);
  } catch (e) {
    throw new ValidationError(
      "ENPMVIEW",
      `Could not get current version of ${packageName} via \`npm view\`.\n Please verify that \`npm view ${packageName}\` completes successfully from the root of the workspace.`
    );
  }

  const distTagsResponse: DistTagsResponse = JSON.parse(result.stdout);
  const version: string | undefined = distTagsResponse[distTag];

  if (!version) {
    throw new ValidationError(
      "ENODISTTAG",
      `No version found for ${packageName}@${distTag}.\n If you are trying to version based on a different tag than 'latest', ensure that it is provided with the --distTag option.`
    );
  }

  return version;
}
