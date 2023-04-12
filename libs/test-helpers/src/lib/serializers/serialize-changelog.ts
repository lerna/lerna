// eslint-disable-next-line @typescript-eslint/no-var-requires
const normalizeNewline = require("normalize-newline");
import { gitSHASerializer } from "./serialize-git-sha";

export const changelogSerializer: jest.SnapshotSerializerPlugin = {
  serialize: (str: string) => {
    return gitSHASerializer
      .serialize(normalizeNewline(str))
      .replace(/(\[.*?\])\(.*\/compare\/(.*?)\)/g, "$1(/compare/$2)")
      .replace(/(\[.*?\])\(.*\/commit(s?)\/GIT_HEAD\)/g, "$1(COMMIT_URL)")
      .replace(/\(\d{4}-\d{2}-\d{2}\)/g, "(YYYY-MM-DD)");
  },
  test: (val: unknown) => {
    return val != null && typeof val === "string";
  },
};
