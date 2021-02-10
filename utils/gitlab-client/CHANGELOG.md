# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0](https://gitlab.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* **deps:** Bump dependencies ([affed1c](https://gitlab.com/lerna/lerna/commit/affed1ce0fce91f01b0a9eafe357db2d985b974f))
* Consume named exports of sibling modules ([63499e3](https://gitlab.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://gitlab.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))
* Expose named export ([c1303f1](https://gitlab.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://gitlab.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
* **deps:** whatwg-url@^8.4.0 ([5dfb7f0](https://gitlab.com/lerna/lerna/commit/5dfb7f0ee196a0c9b9010339d512a5b5b9b75a47))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





# [3.15.0](https://gitlab.com/lerna/lerna/compare/v3.14.2...v3.15.0) (2019-06-09)


### Features

* **version:** Add `--create-release=[gitlab|github]` option ([#2073](https://gitlab.com/lerna/lerna/issues/2073)) ([4974b78](https://gitlab.com/lerna/lerna/commit/4974b78))
