"use strict";

module.exports = {
  plugins: [
    [
      "module:fast-async",
      {
        compiler: {
          es6target: true,
          noRuntime: true,
        },
      },
    ],
  ],
};
