/* eslint-disable no-console */
import log from "npmlog";

export default function output(...args) {
  log.clearProgress();
  console.log(...args);
  log.showProgress();
}
