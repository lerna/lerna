import logger from "./logger";
import path from "path";
let config;

export default class ConfigUtilities {
  @logger.logifySync()
  static readSync(rootPath) {
    if (!rootPath) {
      throw new Error("rootPath is required, please provide it as an argument.");
    }
    config = config || require(path.join(rootPath, "lerna.json"));
    return config;
  }
}
