import execa from "execa";

export default gitInit;

async function gitInit(cwd, message) {
  const opts = { cwd };

  await execa("git", ["init", "."], opts);
  await execa("git", ["config", "commit.gpgSign", "false"], opts);
  await execa("git", ["add", "-A"], opts);
  await execa("git", ["commit", "-m", message], opts);
}
