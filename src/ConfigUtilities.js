import logger from "./logger";
import FileSystemUtilities from "./FileSystemUtilities";
import path from "path";

// Cache the config at the module level so that it is only read from disk once.
let config;

export default class ConfigUtilities {
  @logger.logifySync()
  static readSync(rootPath) {
    config = config || JSON.parse(FileSystemUtilities.readFileSync(path.join(rootPath, "lerna.json")));
    return config;
  }

  @logger.logifySync()
  static writeSync(rootPath, conf) {
    config = conf;
    FileSystemUtilities.writeFileSync(path.join(rootPath, "lerna.json"), JSON.stringify(config));
  }
}
