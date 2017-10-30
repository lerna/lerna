import path from "path";

export default initExecTest;

function initExecTest(fixtureDir) {
  const execTestDir = path.resolve(__dirname, `../fixtures/${fixtureDir}`);

  return {
    // POSIX
    PATH: `${execTestDir}${path.delimiter}${process.env.PATH}`,
    // Windows, aka hell-on-earth
    Path: `${execTestDir}${path.delimiter}${process.env.Path}`,
  };
}
