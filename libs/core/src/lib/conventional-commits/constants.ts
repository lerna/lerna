export type VersioningStrategy = "independent" | "fixed";
export type ChangelogType = "fixed" | "independent" | "root";
export type ChangelogPresetConfig = string | { name: string; [key: string]: unknown };
export type BaseChangelogOptions = {
  changelogPreset?: ChangelogPresetConfig;
  rootPath: string;
  tagPrefix?: string;
  conventionalBumpPrerelease?: boolean;
};

// changelogs are always written with LF line endings
export const EOL = "\n";

export const BLANK_LINE = EOL + EOL;

export const COMMIT_GUIDELINE =
  "See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.";

export const CHANGELOG_HEADER = [
  "# Change Log",
  "",
  "All notable changes to this project will be documented in this file.",
  COMMIT_GUIDELINE,
].join(EOL);
