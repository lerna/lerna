# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.1.8](https://github.com/lerna/lerna/compare/v5.1.7...v5.1.8) (2022-07-07)

**Note:** Version bump only for package @lerna/query-graph





## [5.1.7](https://github.com/lerna/lerna/compare/v5.1.6...v5.1.7) (2022-07-06)

**Note:** Version bump only for package @lerna/query-graph





## [5.1.6](https://github.com/lerna/lerna/compare/v5.1.5...v5.1.6) (2022-06-24)

**Note:** Version bump only for package @lerna/query-graph





## [5.1.5](https://github.com/lerna/lerna/compare/v5.1.4...v5.1.5) (2022-06-24)

**Note:** Version bump only for package @lerna/query-graph





## [5.1.4](https://github.com/lerna/lerna/compare/v5.1.3...v5.1.4) (2022-06-15)

**Note:** Version bump only for package @lerna/query-graph





## [5.1.3](https://github.com/lerna/lerna/compare/v5.1.2...v5.1.3) (2022-06-15)

**Note:** Version bump only for package @lerna/query-graph





## [5.1.2](https://github.com/lerna/lerna/compare/v5.1.1...v5.1.2) (2022-06-13)

**Note:** Version bump only for package @lerna/query-graph





## [5.1.1](https://github.com/lerna/lerna/compare/v5.1.0...v5.1.1) (2022-06-09)


### Bug Fixes

* allow maintenance LTS node 14 engines starting at 14.15.0 ([#3161](https://github.com/lerna/lerna/issues/3161)) ([72305e4](https://github.com/lerna/lerna/commit/72305e4dbab607a2d87ae4efa6ee577c93a9dda9))





# [5.1.0](https://github.com/lerna/lerna/compare/v5.0.0...v5.1.0) (2022-06-07)

**Note:** Version bump only for package @lerna/query-graph





# [5.1.0-alpha.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.1.0-alpha.0) (2022-05-25)

**Note:** Version bump only for package @lerna/query-graph





# [5.0.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.0.0) (2022-05-24)

**Note:** Version bump only for package @lerna/query-graph





# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Bug Fixes

* Improve accuracy of JSDoc type annotations ([1ec69f0](https://github.com/lerna/lerna/commit/1ec69f0e0f7a3f1e0c74dbacb17fab2d7b7a8a44))


### Features

* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))
* Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
* **query-graph:** Remove figgy-pudding ([3b0e2fe](https://github.com/lerna/lerna/commit/3b0e2fec7c274bc93627404295b51638cb7d7e60))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





## [3.18.5](https://github.com/lerna/lerna/compare/v3.18.4...v3.18.5) (2019-11-20)

**Note:** Version bump only for package @lerna/query-graph





# [3.18.0](https://github.com/lerna/lerna/compare/v3.17.0...v3.18.0) (2019-10-15)

**Note:** Version bump only for package @lerna/query-graph





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)


### Bug Fixes

* **package-graph:** Flatten cycles to avoid skipping packages ([#2185](https://github.com/lerna/lerna/issues/2185)) ([b335763](https://github.com/lerna/lerna/commit/b335763))





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)


### Features

* **query-graph:** Add toposort() helper ([90759c2](https://github.com/lerna/lerna/commit/90759c2))
* **run:** Add just-in-time queue management ([#2045](https://github.com/lerna/lerna/issues/2045)) ([6eca172](https://github.com/lerna/lerna/commit/6eca172))
