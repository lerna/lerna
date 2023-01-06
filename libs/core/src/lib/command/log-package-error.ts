import log from "npmlog";
// import { ExecaErrorWithLernaPackage } from "../child-process";

export function logPackageError(err: any, stream = false) {
  log.error(err.command, `exited ${err.exitCode} in '${err.pkg.name}'`);

  if (stream) {
    // Streaming has already printed all stdout/stderr
    return;
  }

  if (err.stdout) {
    log.error(err.command, "stdout:");
    directLog(err.stdout);
  }

  if (err.stderr) {
    log.error(err.command, "stderr:");
    directLog(err.stderr);
  }

  // Below is just to ensure something sensible is printed after the long stream of logs
  log.error(err.command, `exited ${err.exitCode} in '${err.pkg.name}'`);
}

function directLog(message: string) {
  log.pause();
  console.error(message); // eslint-disable-line no-console
  log.resume();
}
