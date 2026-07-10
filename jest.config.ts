const { getJestProjectsAsync } = require('@nx/jest');
import type { Config } from "jest";

module.exports = async (): Promise<Config> => ({
  projects: await getJestProjectsAsync(),
});
