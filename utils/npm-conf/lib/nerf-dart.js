"use strict";

const url = require("url");

module.exports = toNerfDart;

// https://github.com/npm/npm/blob/0cc9d89/lib/config/nerf-dart.js
function toNerfDart(uri) {
  const parsed = url.parse(uri);

  delete parsed.protocol;
  delete parsed.auth;
  delete parsed.query;
  delete parsed.search;
  delete parsed.hash;

  return url.resolve(url.format(parsed), ".");
}
