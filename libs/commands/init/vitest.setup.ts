import path from "path";

// The InitCommand constructor immediately runs execute() against process.cwd().
// Under jest (via the @nx/jest executor) tests always ran from the workspace
// root, where a lerna.json exists, so execute() exited early without touching
// the file system. Running `vitest run` from the project directory would
// otherwise let execute() scaffold a real lerna workspace (and run a package
// manager install) inside libs/commands/init, so pin cwd to the workspace root.
process.chdir(path.resolve(__dirname, "../../.."));
