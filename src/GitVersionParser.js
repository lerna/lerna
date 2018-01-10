import { escapeRegExp } from "lodash";
import hostedGitInfo from "hosted-git-info";

export default class GitVersionParser {
  constructor(versionPrefix = "v") {
    this._gitUrlPattern = new RegExp(`(.+?#${escapeRegExp(versionPrefix)})(.+)$`);
  }

  parseVersion(version) {
    const gitInfo = hostedGitInfo.fromUrl(version);
    let targetMatches;

    if (gitInfo && gitInfo.committish) {
      targetMatches = this._gitUrlPattern.exec(version);
    }

    return {
      prefix: targetMatches ? targetMatches[1] : null,
      version: targetMatches ? targetMatches[2] : version,
    };
  }
}
