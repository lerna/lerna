# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* **deps:** @octokit/rest@^18.0.9 ([f064a55](https://github.com/lerna/lerna/commit/f064a55627994a08f5ba9f735fcd5b2c3491e431))
* **deps:** Bump dependencies ([affed1c](https://github.com/lerna/lerna/commit/affed1ce0fce91f01b0a9eafe357db2d985b974f))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))


### BREAKING CHANGES

* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





# [3.22.0](https://github.com/lerna/lerna/compare/v3.21.0...v3.22.0) (2020-05-24)


### Bug Fixes

* **deps:** upgrade octokit/enterprise-rest to v6 ([#2464](https://github.com/lerna/lerna/issues/2464)) ([b44ea75](https://github.com/lerna/lerna/commit/b44ea753fb9405432bc9fea84726fae365bf4cd8))





## [3.16.5](https://github.com/lerna/lerna/compare/v3.16.4...v3.16.5) (2019-10-07)

**Note:** Version bump only for package @lerna/github-client





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)


### Features

* **deps:** `@octokit/plugin-enterprise-rest@^3.6.1` ([74a3890](https://github.com/lerna/lerna/commit/74a3890))
* **deps:** `@octokit/rest@^16.28.4` ([5f09f50](https://github.com/lerna/lerna/commit/5f09f50))





## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)

**Note:** Version bump only for package @lerna/github-client





## [3.13.3](https://github.com/lerna/lerna/compare/v3.13.2...v3.13.3) (2019-04-17)

**Note:** Version bump only for package @lerna/github-client





## [3.13.1](https://github.com/lerna/lerna/compare/v3.13.0...v3.13.1) (2019-02-26)


### Bug Fixes

* **deps:** Upgrade octokit libs ([ea490cd](https://github.com/lerna/lerna/commit/ea490cd))





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Features

* **version:** Create Github releases with `--github-release` ([#1864](https://github.com/lerna/lerna/issues/1864)) ([f84a631](https://github.com/lerna/lerna/commit/f84a631)), closes [#1513](https://github.com/lerna/lerna/issues/1513)
