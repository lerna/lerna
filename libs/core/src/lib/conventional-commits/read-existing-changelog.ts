import fs from "fs-extra";
import path from "path";
import { Package } from "../package";
import { BLANK_LINE, COMMIT_GUIDELINE } from "./constants";

/**
 * Read the existing changelog, if it exists.
 * @returns A tuple of changelog location and contents
 */
export function readExistingChangelog(pkg: Package): Promise<[string, string]> {
  const changelogFileLoc = path.join(pkg.location, "CHANGELOG.md");

  let chain = Promise.resolve();

  // catch allows missing file to pass without breaking chain
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then(() => fs.readFile(changelogFileLoc, "utf8").catch(() => ""));

  chain = chain.then((changelogContents) => {
    // Remove the header if it exists, thus starting at the first entry.
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const headerIndex = changelogContents.indexOf(COMMIT_GUIDELINE);

    if (headerIndex !== -1) {
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return changelogContents.substring(headerIndex + COMMIT_GUIDELINE.length + BLANK_LINE.length);
    }

    return changelogContents;
  });

  // consumer expects resolved tuple
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then((changelogContents) => [changelogFileLoc, changelogContents]);

  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return chain;
}
