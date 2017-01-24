## v2.0.0-beta.32 (2017-01-04)

#### Bug fix
* [#435](https://github.com/lerna/lerna/pull/435) Use symlinks with relative paths instead of absolute on non-windows environments (Closes [#423](https://github.com/lerna/lerna/issues/423)).. ([@JaapRood](https://github.com/JaapRood))
* [#440](https://github.com/lerna/lerna/pull/440) Change testing NODE_ENV to "lerna-test" (Closes [#406](https://github.com/lerna/lerna/issues/406)). ([@ryb73](https://github.com/ryb73))
* [#444](https://github.com/lerna/lerna/pull/444) Use correct logger method for warnings. ([@evocateur](https://github.com/evocateur))

#### Committers: 3
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Jaap van Hardeveld ([JaapRood](https://github.com/JaapRood))
- Ryan Biwer ([ryb73](https://github.com/ryb73))

## v2.0.0-beta.31 (2016-12-14)

#### Enhancement
* [#365](https://github.com/lerna/lerna/pull/365) Add support for configurable package locations. ([@gigabo](https://github.com/gigabo))

Lerna now supports packages outside of the `packages/` directory!

Configured via an array of globs in `lerna.json`:

```json
{
  "lerna": "2.0.0-beta.31",
  "version": "1.1.3",
  "packages": ["packages/*"]
}
```

* [#436](https://github.com/lerna/lerna/pull/436) Highlight private packages in updated/publish output. ([@chrishelgert](https://github.com/chrishelgert))

No more confusion about what will actually get published!

![example](https://cloud.githubusercontent.com/assets/3918488/20965291/4c6a753c-bc75-11e6-9b6d-853f0952b647.png)

* [#367](https://github.com/lerna/lerna/pull/367) Make log levels more like npm.  ([@gigabo](https://github.com/gigabo))

Adds a `--loglevel [silent|error|warn|success|info|verbose|silly]` option.

Any logs of a higher level than the setting are shown. The default is "info".

* [#386](https://github.com/lerna/lerna/pull/386) Add --scope and --ignore support for bootstrap, exec, run, clean and ls. ([@lukebatchelor](https://github.com/lukebatchelor))
* [#358](https://github.com/lerna/lerna/pull/358) Run pre/post install scripts during bootstrap. ([@seansfkelley](https://github.com/seansfkelley))

#### Bug fix
* [#442](https://github.com/lerna/lerna/pull/442) Increase maxBuffer. ([@rygine](https://github.com/rygine))
* [#372](https://github.com/lerna/lerna/pull/372) Fix logifyAsync, logifySync decorators. ([@seansfkelley](https://github.com/seansfkelley))

#### Committers: 15
- Bastian Heist ([beheist](https://github.com/beheist))
- Ben Briggs ([ben-eb](https://github.com/ben-eb))
- Ben Clinkinbeard ([bclinkinbeard](https://github.com/bclinkinbeard))
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Chris Helgert ([chrishelgert](https://github.com/chrishelgert))
- Elise Chant ([elisechant](https://github.com/elisechant))
- Gary Johnson ([garyjN7](https://github.com/garyjN7))
- Henry Zhu ([hzoo](https://github.com/hzoo))
- Ivan Akulov ([iamakulov](https://github.com/iamakulov))
- James K ([thejameskyle](https://github.com/thejameskyle))
- Joscha Feth ([joscha](https://github.com/joscha))
- MURAKAMI Masahiko ([fossamagna](https://github.com/fossamagna))
- Sean Kelley ([seansfkelley](https://github.com/seansfkelley))
- Teppei Sato ([teppeis](https://github.com/teppeis))
- [lukebatchelor](https://github.com/lukebatchelor)
