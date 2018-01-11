import path from "path";
import pathKey from "path-key";

export default initExecTest;

function initExecTest(fixtureDir) {
  const execTestDir = path.resolve(__dirname, `../fixtures/${fixtureDir}`);
  const key = pathKey();
  const previousPath = process.env[key];

  return {
    // POSIX or Windows, depending on what was found by pathKey()
    [key]: `${execTestDir}${path.delimiter}${previousPath}`,
  };
}
