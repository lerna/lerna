# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))
* Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
* **collect-uncommitted:** Remove figgy-pudding ([621b382](https://github.com/lerna/lerna/commit/621b3821cf0ce4921a0815e0ce33a8222c7b172b))
* **deps:** chalk@^4.1.0 ([d2a9ed5](https://github.com/lerna/lerna/commit/d2a9ed537139f49561a7e29b3ebf624c97f48c77))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





## [3.16.5](https://github.com/lerna/lerna/compare/v3.16.4...v3.16.5) (2019-10-07)

**Note:** Version bump only for package @lerna/collect-uncommitted





## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)

**Note:** Version bump only for package @lerna/collect-uncommitted





## [3.14.1](https://github.com/lerna/lerna/compare/v3.14.0...v3.14.1) (2019-05-15)


### Bug Fixes

* **collect-uncommitted:** Call `git` with correct arguments, test properly ([551e6e4](https://github.com/lerna/lerna/commit/551e6e4)), closes [#2091](https://github.com/lerna/lerna/issues/2091)





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)


### Features

* **publish:** Display uncommitted changes when validation fails ([#2066](https://github.com/lerna/lerna/issues/2066)) ([ea41fe9](https://github.com/lerna/lerna/commit/ea41fe9))
* Create `@lerna/collect-uncommitted`
