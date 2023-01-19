import log from "npmlog";

// istanbul ignore next
export function output(...args: any[]) {
  log["clearProgress"]();
  console.log(...args);
  log["showProgress"]();
}
