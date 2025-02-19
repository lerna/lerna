module.exports = async () => {
  // Plugin isolation is not relevant to lerna or its tests
  process.env.NX_ISOLATE_PLUGINS = "false";
};
