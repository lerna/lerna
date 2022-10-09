# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.6.2](https://github.com/lerna/lerna/compare/v5.6.1...v5.6.2) (2022-10-09)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.6.1](https://github.com/lerna/lerna/compare/v5.6.0...v5.6.1) (2022-09-30)

**Note:** Version bump only for package @lerna/map-to-registry

# [5.6.0](https://github.com/lerna/lerna/compare/v5.5.4...v5.6.0) (2022-09-29)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.5.4](https://github.com/lerna/lerna/compare/v5.5.3...v5.5.4) (2022-09-28)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.5.3](https://github.com/lerna/lerna/compare/v5.5.2...v5.5.3) (2022-09-28)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.5.2](https://github.com/lerna/lerna/compare/v5.5.1...v5.5.2) (2022-09-20)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.5.1](https://github.com/lerna/lerna/compare/v5.5.0...v5.5.1) (2022-09-09)

**Note:** Version bump only for package @lerna/map-to-registry

# [5.5.0](https://github.com/lerna/lerna/compare/v5.4.3...v5.5.0) (2022-08-31)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.4.3](https://github.com/lerna/lerna/compare/v5.4.2...v5.4.3) (2022-08-16)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.4.2](https://github.com/lerna/lerna/compare/v5.4.1...v5.4.2) (2022-08-14)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.4.1](https://github.com/lerna/lerna/compare/v5.4.0...v5.4.1) (2022-08-12)

**Note:** Version bump only for package @lerna/map-to-registry

# [5.4.0](https://github.com/lerna/lerna/compare/v5.3.0...v5.4.0) (2022-08-08)

**Note:** Version bump only for package @lerna/map-to-registry

# [5.3.0](https://github.com/lerna/lerna/compare/v5.2.0...v5.3.0) (2022-07-27)

**Note:** Version bump only for package @lerna/map-to-registry

# [5.2.0](https://github.com/lerna/lerna/compare/v5.1.8...v5.2.0) (2022-07-22)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.1.8](https://github.com/lerna/lerna/compare/v5.1.7...v5.1.8) (2022-07-07)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.1.7](https://github.com/lerna/lerna/compare/v5.1.6...v5.1.7) (2022-07-06)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.1.6](https://github.com/lerna/lerna/compare/v5.1.5...v5.1.6) (2022-06-24)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.1.5](https://github.com/lerna/lerna/compare/v5.1.4...v5.1.5) (2022-06-24)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.1.4](https://github.com/lerna/lerna/compare/v5.1.3...v5.1.4) (2022-06-15)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.1.3](https://github.com/lerna/lerna/compare/v5.1.2...v5.1.3) (2022-06-15)

**Note:** Version bump only for package @lerna/map-to-registry

## [5.1.2](https://github.com/lerna/lerna/compare/v5.1.1...v5.1.2) (2022-06-13)

### Bug Fixes

- update all transitive inclusions of ansi-regex ([#3166](https://github.com/lerna/lerna/issues/3166)) ([56eaa15](https://github.com/lerna/lerna/commit/56eaa153283be3b1e7d7793d3266fc51801fad8e))

## [5.1.1](https://github.com/lerna/lerna/compare/v5.1.0...v5.1.1) (2022-06-09)

### Bug Fixes

- allow maintenance LTS node 14 engines starting at 14.15.0 ([#3161](https://github.com/lerna/lerna/issues/3161)) ([72305e4](https://github.com/lerna/lerna/commit/72305e4dbab607a2d87ae4efa6ee577c93a9dda9))

# [5.1.0](https://github.com/lerna/lerna/compare/v5.0.0...v5.1.0) (2022-06-07)

**Note:** Version bump only for package @lerna/map-to-registry

# [5.1.0-alpha.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.1.0-alpha.0) (2022-05-25)

**Note:** Version bump only for package @lerna/map-to-registry

# [5.0.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.0.0) (2022-05-24)

**Note:** Version bump only for package @lerna/map-to-registry

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)

### Features

- **deps:** npm-package-arg@^8.1.0 ([12c8923](https://github.com/lerna/lerna/commit/12c892342d33b86a00ee2cf9079f9b26fe316dc6))
- Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))

### BREAKING CHANGES

- Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:

```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```

(requires `npm i -g json` beforehand)

# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)

### Features

- **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
- **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))

<a name="3.0.0"></a>

# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)

**Note:** Version bump only for package @lerna/map-to-registry

<a name="3.0.0-beta.8"></a>

# [3.0.0-beta.8](https://github.com/lerna/lerna/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2018-03-22)

### Features

- **utils:** Add [@lerna](https://github.com/lerna)/map-to-registry ([ce72828](https://github.com/lerna/lerna/commit/ce72828))
