"use strict";

const { recommendVersion } = require("./lib/recommend-version");
const { updateChangelog } = require("./lib/update-changelog");

exports.recommendVersion = recommendVersion;
exports.updateChangelog = updateChangelog;

/** @typedef {'fixed' | 'independent'} VersioningStrategy */
/** @typedef {'fixed' | 'independent' | 'root'} ChangelogType */
/** @typedef {string | { name: string; [key: string]: unknown }} ChangelogPresetConfig */
/**
 * @typedef {object} BaseChangelogOptions
 * @property {ChangelogPresetConfig} [changelogPreset]
 * @property {string} [rootPath] of project
 * @property {string} [tagPrefix] defaults to "v"
 */
