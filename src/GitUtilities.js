import { EOL } from "os";
import tempWrite from "temp-write";
import ChildProcessUtilities from "./ChildProcessUtilities";
import logger from "./logger";
import escapeArgs from "command-join";

export default class GitUtilities {
  @logger.logifySync()
  static isDetachedHead(opts) {
    const branchName = GitUtilities.getCurrentBranch(opts);
    return branchName === "HEAD";
  }

  @logger.logifySync()
  static isInitialized(opts) {
    try {
      // we only want the return code, so ignore stdout/stderr
      ChildProcessUtilities.execSync("git rev-parse", Object.assign({}, opts, {
        stdio: "ignore"
      }));
      return true;
    } catch (err) {
      return false;
    }
  }

  @logger.logifySync()
  static addFile(file, opts) {
    ChildProcessUtilities.execSync("git add " + escapeArgs(file), opts);
  }

  @logger.logifySync()
  static commit(message, opts) {
    const cmd = ["git", "commit"];

    if (message.indexOf(EOL) > -1) {
      // Use tempfile to allow multi\nline strings.
      cmd.push("-F", tempWrite.sync(message, "lerna-commit.txt"));
    } else {
      cmd.push("-m", message);
    }

    ChildProcessUtilities.execSync(cmd.join(" "), opts);
  }

  @logger.logifySync()
  static addTag(tag, opts) {
    ChildProcessUtilities.execSync("git tag -a " + tag + " -m \"" + tag + "\"", opts);
  }

  @logger.logifySync()
  static removeTag(tag, opts) {
    ChildProcessUtilities.execSync("git tag -d " + tag, opts);
  }

  @logger.logifySync()
  static hasTags(opts) {
    return !!ChildProcessUtilities.execSync("git tag", opts);
  }

  @logger.logifySync()
  static getLastTaggedCommit(opts) {
    return ChildProcessUtilities.execSync("git rev-list --tags --max-count=1", opts);
  }

  @logger.logifySync()
  static getLastTaggedCommitInBranch(opts) {
    const tagName = GitUtilities.getLastTag(opts);
    return ChildProcessUtilities.execSync("git rev-list -n 1 " + tagName, opts);
  }

  @logger.logifySync()
  static getFirstCommit(opts) {
    return ChildProcessUtilities.execSync("git rev-list --max-parents=0 HEAD", opts);
  }

  @logger.logifySync()
  static pushWithTags(remote, tags, opts) {
    const branch = GitUtilities.getCurrentBranch(opts);
    ChildProcessUtilities.execSync(`git push ${remote} ${branch}`, opts);
    ChildProcessUtilities.execSync(`git push ${remote} ${tags.join(" ")}`, opts);
  }

  @logger.logifySync()
  static getLastTag(opts) {
    return ChildProcessUtilities.execSync("git describe --tags --abbrev=0", opts);
  }

  @logger.logifySync()
  static describeTag(commit, opts) {
    return ChildProcessUtilities.execSync("git describe --tags " + commit, opts);
  }

  @logger.logifySync()
  static diffSinceIn(since, location, opts) {
    return ChildProcessUtilities.execSync(`git diff --name-only ${since} -- ${escapeArgs(location)}`, opts);
  }

  @logger.logifySync()
  static getCurrentBranch(opts) {
    return ChildProcessUtilities.execSync("git rev-parse --abbrev-ref HEAD", opts);
  }

  @logger.logifySync()
  static getCurrentSHA(opts) {
    return ChildProcessUtilities.execSync("git rev-parse HEAD", opts);
  }

  @logger.logifySync()
  static checkoutChanges(changes, opts) {
    ChildProcessUtilities.execSync("git checkout -- " + changes, opts);
  }

  @logger.logifySync()
  static init(opts) {
    return ChildProcessUtilities.execSync("git init", opts);
  }

  @logger.logifySync()
  static hasCommit(opts) {
    try {
      ChildProcessUtilities.execSync("git log", opts);
      return true;
    } catch (e) {
      return false;
    }
  }
}
