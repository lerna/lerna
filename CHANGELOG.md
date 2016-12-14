## v2.0.0-beta.31 (2016-12-14)

#### Enhancement
* [#365](https://github.com/lerna/lerna/pull/365) [Feature] Add support for configurable package locations. ([@gigabo](https://github.com/gigabo))

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

* [#386](https://github.com/lerna/lerna/pull/386) [Feature] Adds --scope and --ignore support for bootstrap, exec, run, clean and ls. ([@lukebatchelor](https://github.com/lukebatchelor))

#### Bug fix
* [#442](https://github.com/lerna/lerna/pull/442) Increase maxBuffer. ([@rygine](https://github.com/rygine))

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
