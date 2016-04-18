import child from "child_process";

function attempt(command) {
  try {
    return child.execSync(command).trim();
  } catch (err) {
    return null;
  }
}

const gitEmail = attempt("git config --get user.email");
const gitName = attempt("git config --get user.name");

before(() => {
  if (!gitEmail) child.execSync("git config user.email test@example.com");
  if (!gitName) child.execSync("git config user.name 'Tester McPerson'");
});

after(() => {
  if (!gitEmail) child.execSync("git config --unset user.email");
  if (!gitName) child.execSync("git config --unset user.name");
});
