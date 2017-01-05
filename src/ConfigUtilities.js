import logger from "./logger";
import FileSystemUtilities from "./FileSystemUtilities";
import path from "path";
let config;

export default class ConfigUtilities {
  @logger.logifySync()
  static read(rootPath) {
    config = config || require(path.join(rootPath, "lerna.json"));
    return config;
  }

  @logger.logifySync()
  static write(rootPath, conf) {
    config = conf;
    FileSystemUtilities.writeFileSync(path.join(rootPath, "lerna.json"), JSON.stringify(config));
  }
}
