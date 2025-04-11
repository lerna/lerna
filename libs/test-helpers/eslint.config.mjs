import baseConfig from "../../eslint.config.mjs";

export default [
  {
    ignores: ["**/dist"],
  },
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "node/no-extraneous-require": "off",
      "import/no-extraneous-dependencies": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    // Override or add rules here
    rules: {},
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    // Override or add rules here
    rules: {},
  },
];
