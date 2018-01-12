import log from "npmlog";

export default class ValidationError extends Error {
  constructor(prefix, message) {
    super(message);
    this.name = "ValidationError";
    this.prefix = prefix;
    log.error(prefix, message);
  }
}
