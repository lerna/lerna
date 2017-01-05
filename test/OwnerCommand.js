import assert from "assert";
import assertStubbedCalls from "./_assertStubbedCalls";

import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import ConfigUtilities from "../src/ConfigUtilities";
import NpmUtilities from "../src/NpmUtilities";
import OwnerCommand from "../src/commands/OwnerCommand";
import logger from "../src/logger";
import stub from "./_stub";

describe("OwnerCommand", () => {

  describe("in a basic repo", () => {
    let dir;
    beforeEach((done) => {
      dir = initFixture("OwnerCommand/basic", done);
    });

    it("should complain if invoked without command", (done) => {
      const ownerCommand = new OwnerCommand([], {});

      ownerCommand.runValidations();
      ownerCommand.runPreparations();

      assertStubbedCalls([
        [ConfigUtilities, "readSync", {}, [
          { args: [dir], returns: { owners: ["douglas.b.wade"] } }
        ]],
      ]);

      ownerCommand.runCommand(exitWithCode(1, (err) => {
        assert.ok(err instanceof Error);
        done();
      }));
    });

    it("should add an owner without error", (done) => {
      const ownerName = "douglas.wade";
      const ownerCommand = new OwnerCommand(["add", ownerName], {});

      ownerCommand.runValidations();
      ownerCommand.runPreparations();

      let npmCounter = 1;
      stub(NpmUtilities, "addOwner", (actualOwnerName, actualPackageName) => {
        assert.equal(actualPackageName, `package-${npmCounter++}`);
        assert.equal(actualOwnerName, ownerName);
      });

      let loggerCounter = 1;
      stub(logger, "info", (message) => {
        assert.equal(message, `Added owner ${ownerName} to package package-${loggerCounter++}`);
      });

      stub(ConfigUtilities, "writeSync", (actualRootPath, actualConfig) => {
        assert.ok(actualConfig.owners.indexOf(ownerName) > -1);
      });

      ownerCommand.runCommand(exitWithCode(0, () => {
        assert.equal(npmCounter, 3);
        assert.equal(loggerCounter, 3);
        done();
      }));
    });

    it("should remove an owner without error", (done) => {
      const ownerName = "douglas.wade";
      const ownerCommand = new OwnerCommand(["rm", ownerName], {});

      ownerCommand.runValidations();
      ownerCommand.runPreparations();

      let npmCounter = 1;
      stub(NpmUtilities, "removeOwner", (actualOwnerName, actualPackageName) => {
        assert.equal(actualPackageName, `package-${npmCounter++}`);
        assert.equal(actualOwnerName, ownerName);
      });

      let loggerCounter = 1;
      stub(logger, "info", (message) => {
        assert.equal(message, `Removed owner ${ownerName} from package package-${loggerCounter++}`);
      });

      stub(ConfigUtilities, "writeSync", (actualRootPath, actualConfig) => {
        assert.ok(actualConfig.owners.indexOf(ownerName) < 0);
      });

      ownerCommand.runCommand(exitWithCode(0, () => {
        assert.equal(npmCounter, 2);
        assert.equal(loggerCounter, 2);
        done();
      }));
    });
  });

  describe("in a legacy repo", () => {
    let dir;
    beforeEach((done) => {
      dir = initFixture("OwnerCommand/legacy", done);
    });

    it("should complain if an owner is removed", (done) => {
      const ownerCommand = new OwnerCommand(["rm", "douglas.wade"], {});

      ownerCommand.runValidations();
      ownerCommand.runPreparations();

      assertStubbedCalls([
        [ConfigUtilities, "readSync", {}, [
          { args: [dir], returns: { name: "test", lerna: "2.0.0-beta.34", } }
        ]],
      ]);

      ownerCommand.runCommand(exitWithCode(1, (err) => {
        assert.ok(err instanceof Error);
        done();
      }));
    });

    it("should add an owner without error", (done) => {
      const ownerName = "douglas.wade";
      const ownerCommand = new OwnerCommand(["add", ownerName], {});

      ownerCommand.runValidations();
      ownerCommand.runPreparations();

      let npmCounter = 1;
      stub(NpmUtilities, "addOwner", (actualOwnerName, actualPackageName) => {
        assert.equal(actualPackageName, `package-${npmCounter++}`);
        assert.equal(actualOwnerName, ownerName);
      });

      let loggerCounter = 1;
      stub(logger, "info", (message) => {
        assert.equal(message, `Added owner ${ownerName} to package package-${loggerCounter++}`);
      });

      stub(ConfigUtilities, "writeSync", (actualRootPath, actualConfig) => {
        assert.ok(actualConfig.owners.indexOf(ownerName) > -1);
      });

      ownerCommand.runCommand(exitWithCode(0, () => {
        assert.equal(npmCounter, 3);
        assert.equal(loggerCounter, 3);
        done();
      }));
    });
  });

  describe("in a repo with a private package", () => {
    beforeEach((done) => {
      initFixture("OwnerCommand/private", done);
    });

    it("should complain if invoked without command", (done) => {
      const ownerCommand = new OwnerCommand([], {});

      ownerCommand.runValidations();
      ownerCommand.runPreparations();

      ownerCommand.runCommand(exitWithCode(1, (err) => {
        assert.ok(err instanceof Error);
        done();
      }));
    });

    it("should add an owner without error", (done) => {
      const ownerName = "douglas.wade";
      const ownerCommand = new OwnerCommand(["add", ownerName], {});

      ownerCommand.runValidations();
      ownerCommand.runPreparations();

      let npmCounter = 1;
      stub(NpmUtilities, "addOwner", (actualOwnerName, actualPackageName) => {
        assert.equal(actualPackageName, `package-${npmCounter++}`);
        assert.equal(actualOwnerName, ownerName);
      });

      let loggerCounter = 1;
      stub(logger, "info", (message) => {
        assert.equal(message, `Added owner ${ownerName} to package package-${loggerCounter++}`);
      });

      stub(ConfigUtilities, "writeSync", (actualRootPath, actualConfig) => {
        assert.ok(actualConfig.owners.indexOf(ownerName) > -1);
      });

      ownerCommand.runCommand(exitWithCode(0, () => {
        assert.equal(npmCounter, 2);
        assert.equal(loggerCounter, 1);
        done();
      }));
    });

    it("should remove an owner without error", (done) => {
      const ownerName = "douglas.wade";
      const ownerCommand = new OwnerCommand(["rm", ownerName], {});

      ownerCommand.runValidations();
      ownerCommand.runPreparations();

      let npmCounter = 1;
      stub(NpmUtilities, "removeOwner", (actualOwnerName, actualPackageName) => {
        assert.equal(actualPackageName, `package-${npmCounter++}`);
        assert.equal(actualOwnerName, ownerName);
      });

      let loggerCounter = 1;
      stub(logger, "info", (message) => {
        assert.equal(message, `Removed owner ${ownerName} from package package-${loggerCounter++}`);
      });

      stub(ConfigUtilities, "writeSync", (actualRootPath, actualConfig) => {
        assert.ok(actualConfig.owners.indexOf(ownerName) < 0);
      });

      ownerCommand.runCommand(exitWithCode(0, () => {
        assert.equal(npmCounter, 2);
        assert.equal(loggerCounter, 1);
        done();
      }));
    });
  });
});
