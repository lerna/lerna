# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Bug Fixes

* Improve accuracy of JSDoc type annotations ([1ec69f0](https://github.com/lerna/lerna/commit/1ec69f0e0f7a3f1e0c74dbacb17fab2d7b7a8a44))


### Features

* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))
* Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
* **deps:** p-queue@^6.6.2 ([ed76cdd](https://github.com/lerna/lerna/commit/ed76cdddf57963e7aa3dfbff1f37fe361c9e2769))
* **run-topologically:** Remove figgy-pudding ([f3a73db](https://github.com/lerna/lerna/commit/f3a73db0f083a77fc14bdff2e4da4b2decfa8c8a))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





## [3.18.5](https://github.com/lerna/lerna/compare/v3.18.4...v3.18.5) (2019-11-20)

**Note:** Version bump only for package @lerna/run-topologically





# [3.18.0](https://github.com/lerna/lerna/compare/v3.17.0...v3.18.0) (2019-10-15)

**Note:** Version bump only for package @lerna/run-topologically





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)

**Note:** Version bump only for package @lerna/run-topologically





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)


### Features

* **run:** Extract `@lerna/run-topologically` ([3a8b175](https://github.com/lerna/lerna/commit/3a8b175))
