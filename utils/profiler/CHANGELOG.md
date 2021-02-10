# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* **deps:** Bump dependencies ([affed1c](https://github.com/lerna/lerna/commit/affed1ce0fce91f01b0a9eafe357db2d985b974f))
* Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
* **deps:** fs-extra@^9.0.1 ([2f6f4e0](https://github.com/lerna/lerna/commit/2f6f4e066d5a41b4cd508b3405ac1d0a342932dc))
* **deps:** upath@^2.0.1 ([28ecc48](https://github.com/lerna/lerna/commit/28ecc48aa9f0de6073f0bc534071e2697d8bef98))
* **profiler:** Remove figgy-pudding ([69d4704](https://github.com/lerna/lerna/commit/69d47041e83138869404c131adda3fc3122bf2d9))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





# [3.20.0](https://github.com/lerna/lerna/compare/v3.19.0...v3.20.0) (2019-12-27)


### Features

* Add `--profile` option to `lerna exec` and `lerna run` ([#2376](https://github.com/lerna/lerna/issues/2376)) ([6290174](https://github.com/lerna/lerna/commit/62901748f818516d58efdfd955eacb447e270351))
