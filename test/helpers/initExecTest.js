import path from "path";

export default initExecTest;

function initExecTest(fixtureDir) {
  const execTestDir = path.resolve(__dirname, `../fixtures/${fixtureDir}`);
  return {
    PATH: `${execTestDir}${path.delimiter}${process.env.PATH}`,
    EXEC_TEST: execTestDir
  };
}
