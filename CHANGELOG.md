## v2.0.0-beta.34 (2017-01-31)

2 new flags:

`--no-sort` (only for run, exec and bootstrap)
  
By default, all tasks execute on packages in topologically sorted order as to respect the dependency relationships of the packages in question. Cycles are broken on a best-effort basis in a way not guaranteed to be consistent across Lerna invocations.
  
Topological sorting can cause concurrency bottlenecks if there are a small number of packages with many dependents or if some packages take a disproportionately long time to execute. The `--no-sort` option disables sorting, instead executing tasks in an arbitrary order with maximum concurrency.

#### :rocket: Enhancement
* [#507](https://github.com/lerna/lerna/pull/507) Automatic hoisting of common dependencies. ([@gigabo](https://github.com/gigabo))
* [#547](https://github.com/lerna/lerna/pull/547) Spawn child process for rimraf (speeds up `lerna clean`). ([@roblg](https://github.com/roblg))
* [#543](https://github.com/lerna/lerna/pull/543) [clean] Support `--include-filtered-dependencies` flag. ([@roblg](https://github.com/roblg))
* [#412](https://github.com/lerna/lerna/pull/412) Make bootstrap, exec and run commands execute packages in dependency order by default. ([@seansfkelley](https://github.com/seansfkelley))
* [#373](https://github.com/lerna/lerna/pull/373) [Feature] Log stdout when commands fail. Closes [#343](https://github.com/lerna/lerna/issues/343).. ([@seansfkelley](https://github.com/seansfkelley))

#### :bug: Bug Fix
* [#542](https://github.com/lerna/lerna/pull/542) Fixes issue: prepublish not running in dependencies with `--scope --include-filtered-dependencies`. ([@roblg](https://github.com/roblg))

When running `lerna bootstrap --scope foo --include-filtered-dependencies` run prepublish task with the same flags.

#### :memo: Documentation
* [#465](https://github.com/lerna/lerna/pull/465) Add a note about lerna-wizard.. ([@szarouski](https://github.com/szarouski))

#### :house: Internal
* [#554](https://github.com/lerna/lerna/pull/554) Bump `cross-env`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#560](https://github.com/lerna/lerna/pull/560) redo labels [skip ci]. ([@hzoo](https://github.com/hzoo))
* [#559](https://github.com/lerna/lerna/pull/559) Drop `isarray`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#557](https://github.com/lerna/lerna/pull/557) Fix broken hoisting tests. ([@doug-wade](https://github.com/doug-wade))
* [#549](https://github.com/lerna/lerna/pull/549) Bump `signal-exit`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#548](https://github.com/lerna/lerna/pull/548) Bump `object-assigned-sorted`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#535](https://github.com/lerna/lerna/pull/535) Don't include unnecesary files in the npm package. ([@gpittarelli](https://github.com/gpittarelli))
* [#546](https://github.com/lerna/lerna/pull/546) Drop `object-assign`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#541](https://github.com/lerna/lerna/pull/541) Upgrade `inquirer` dependency. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))

#### Committers: 9
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- George Pittarelli ([gpittarelli](https://github.com/gpittarelli))
- Henry Zhu ([hzoo](https://github.com/hzoo))
- Robert Gay ([roblg](https://github.com/roblg))
- Sean Kelley ([seansfkelley](https://github.com/seansfkelley))
- Sergey Zarouski ([szarouski](https://github.com/szarouski))
- [wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg)
 
## v2.0.0-beta.33 (2017-01-25)

- Drop Node 0.10/0.12/5
- Custom publish commit message
- Publish to a different remote
- Publish exact versions instead of `^`

#### Breaking change
* [#528](https://github.com/lerna/lerna/pull/528) Drop node 5 from travis/appveyor. ([@chitchu](https://github.com/chitchu))
* [#484](https://github.com/lerna/lerna/pull/484) Drop support for node 0.10 and node 0.12. ([@doug-wade](https://github.com/doug-wade))

#### Enhancement
* [#460](https://github.com/lerna/lerna/pull/460) Add --message option for custom commit msgs when publishing. ([@traviskaufman](https://github.com/traviskaufman))

Override default message with `--message` or `-m`

```sh
lerna publish -m "chore: Publish"
```

* [#508](https://github.com/lerna/lerna/pull/508) [Feature] Allow git remote to be changed for publish. ([@tdanecker](https://github.com/tdanecker))

Use a different git remote other than origin

```sh
lerna publish --git-remote upstream
```

* [#390](https://github.com/lerna/lerna/pull/390) [Feature] Adds `--include-filtered-dependencies` flag for bootstrap command. ([@lukebatchelor](https://github.com/lukebatchelor))

`my-component` and all of its dependencies will be bootstrapped

```sh
lerna bootstrap --scope my-component --include-filtered-dependencies 
```

* [#426](https://github.com/lerna/lerna/pull/426) Add support for hidden '--exact' flag. ([@L8D](https://github.com/L8D))

Use exact versions (`"2.1.3"`) instead of with `^` (`"^2.1.3"`)

```sh
lerna publish --exact
```

#### Bug fix
* [#458](https://github.com/lerna/lerna/pull/458) use message passed as argument to the static method input() in PromptUtilities. ([@btiwaree](https://github.com/btiwaree))
* [#483](https://github.com/lerna/lerna/pull/483) 467: lerna bootstrap succeeds with 0 packages. ([@doug-wade](https://github.com/doug-wade))
* [#454](https://github.com/lerna/lerna/pull/454) Use close event to wait for spawned processes to finish. ([@xaka](https://github.com/xaka))

#### Documentation
* [#514](https://github.com/lerna/lerna/pull/514) Update README.md (s/--exclude/--ignore/). ([@xaka](https://github.com/xaka))
* [#459](https://github.com/lerna/lerna/pull/459) Fix import logger info typo. ([@sdgluck](https://github.com/sdgluck))

#### Committers: 9
- Bishesh Tiwaree ([btiwaree](https://github.com/btiwaree))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Pavel Strashkin ([xaka](https://github.com/xaka))
- Sam Gluck ([sdgluck](https://github.com/sdgluck))
- Tenor Biel ([L8D](https://github.com/L8D))
- Thomas Danecker ([tdanecker](https://github.com/tdanecker))
- Travis Kaufman ([traviskaufman](https://github.com/traviskaufman))
- Vicente Jr Yuchitcho ([chitchu](https://github.com/chitchu))
- [lukebatchelor](https://github.com/lukebatchelor)

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
