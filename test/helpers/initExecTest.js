import path from "path";

export default initExecTest;

function initExecTest(fixtureDir) {
  const execTestDir = path.resolve(__dirname, `../fixtures/${fixtureDir}`);
  const execPath = `${execTestDir}${path.delimiter}${process.env.PATH}`;

  return {
    PATH: execPath,
  };
}
