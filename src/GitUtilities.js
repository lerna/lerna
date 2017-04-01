import ChildProcessUtilities from "./ChildProcessUtilities";
import logger from "./logger";
import escapeArgs from "command-join";

export default class GitUtilities {
  @logger.logifySync()
  static isDetachedHead() {
    const branchName = GitUtilities.getCurrentBranch();
    return branchName === "HEAD";
  }

  @logger.logifySync()
  static isInitialized() {
    try {
      // we only want the return code, so ignore stdout/stderr
      ChildProcessUtilities.execSync("git rev-parse", { stdio: "ignore" });
      return true;
    } catch (err) {
      return false;
    }
  }

  @logger.logifySync()
  static addFile(file) {
    ChildProcessUtilities.execSync("git add " + escapeArgs(file));
  }

  @logger.logifySync()
  static commit(message) {
    // Use echo to allow multi\nline strings.
    ChildProcessUtilities.execSync("git commit -m \"$(echo \"" + message + "\")\"");
  }

  @logger.logifySync()
  static addTag(tag) {
    ChildProcessUtilities.execSync("git tag -a " + tag + " -m \"" + tag + "\"");
  }

  @logger.logifySync()
  static removeTag(tag) {
    ChildProcessUtilities.execSync("git tag -d " + tag);
  }

  @logger.logifySync()
  static hasTags() {
    return !!ChildProcessUtilities.execSync("git tag");
  }

  @logger.logifySync()
  static getLastTaggedCommit() {
    return ChildProcessUtilities.execSync("git rev-list --tags --max-count=1");
  }

  @logger.logifySync()
  static getLastTaggedCommitInBranch() {
    const tagName = GitUtilities.getLastTag();
    return ChildProcessUtilities.execSync("git rev-list -n 1 " + tagName);
  }

  @logger.logifySync()
  static getFirstCommit() {
    return ChildProcessUtilities.execSync("git rev-list --max-parents=0 HEAD");
  }

  @logger.logifySync()
  static pushWithTags(remote, tags) {
    ChildProcessUtilities.execSync(`git push ${remote} ${GitUtilities.getCurrentBranch()}`);
    ChildProcessUtilities.execSync(`git push ${remote} ${tags.join(" ")}`);
  }

  @logger.logifySync()
  static getLastTag() {
    return ChildProcessUtilities.execSync("git describe --tags --abbrev=0");
  }

  @logger.logifySync()
  static describeTag(commit) {
    return ChildProcessUtilities.execSync("git describe --tags " + commit);
  }

  @logger.logifySync()
  static diffSinceIn(since, location) {
    return ChildProcessUtilities.execSync("git diff --name-only " + since + " -- " + escapeArgs(location));
  }

  @logger.logifySync()
  static getCurrentBranch() {
    return ChildProcessUtilities.execSync("git rev-parse --abbrev-ref HEAD");
  }

  @logger.logifySync()
  static getCurrentSHA() {
    return ChildProcessUtilities.execSync("git rev-parse HEAD");
  }

  @logger.logifySync()
  static checkoutChanges(changes) {
    ChildProcessUtilities.execSync("git checkout -- " + changes);
  }

  @logger.logifySync()
  static init() {
    return ChildProcessUtilities.execSync("git init");
  }

  @logger.logifySync()
  static hasCommit() {
    try {
      ChildProcessUtilities.execSync("git log");
      return true;
    } catch (e) {
      return false;
    }
  }
}
