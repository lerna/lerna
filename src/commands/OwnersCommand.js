import NpmUtilities from "../NpmUtilities";
import Command from "../Command";
import async from "async";

export default class LsCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback) {
    const [action, username] = this.input;

    switch (action) {
      case "grant": return this.grant(username, callback);
      case "revoke": return this.revoke(username, callback);
      case "update": return this.update(callback);
      default: throw new Error("Idk wtf this action is.");
    }
  }

  grant(username, callback) {
    async.mapLimit(this.packages, 4, (pkg, cb) => {
      NpmUtilities.addOwner(pkg.name, username, cb);
    }, err => {
      callback(err);
    });
  }

  revoke(username, callback) {
    async.mapLimit(this.packages, 5, (pkg, cb) => {
      NpmUtilities.removeOwner(pkg.name, username, cb);
    }, err => {
      callback(err);
    });
  }

  update(callback) {
    async.mapLimit(this.packages, 1, (pkg, outerCb) => {
      async.mapLimit(this.owners, 1, (pkg, cb) => {

      }, outerCb);
    }, err => {

    });
  }
}
