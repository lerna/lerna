# Troubleshooting

This document contains solutions for certain issues our users encountered
in the past while using Lerna.

## Bootstrap Command

### Error when using yarn as an npm client

Prior to the release of Lerna `v2.0.0-rc.3` users of the flag `--npm-client`
who provided yarn as a client may have suffered from the bootstrap process
not being able to run properly.

```
Error running command.
error Command failed with exit code 1.
```

If you can upgrade Lerna to said version please do so, or as an alternative
solution you can add `--concurrency=1`.

### Private npm registry (Artifactory, npm Enterprise, etc) integration issues

If `lerna bootstrap` is failing because you have repositories on a private server make sure you are including that registry. Example: `lerna bootstrap -- --registry=http://[registry-url]`.

## Import Command

### Buffer problems during import

When you try to import a repository which has many commits in it there is a
chance that you get an error such as:

```
DeprecationWarning: Unhandled promise rejections are deprecated
```

or

```
Error: spawnSync /bin/sh ENOBUFS during ImportCommand.execute
```

#### Solution:

Run `lerna import` with the `--max-buffer` flag and provide a large enough
number (in bytes). At the writing of this entry the underlying default is
10MB, so you should keep this in mind.

### Merge conflict commits cannot be imported

When you try to import a repository that contains merge commits that needed
conflict resolutions, the import command fails with an error:

```
lerna ERR! execute Error: Command failed: git am -3
lerna ERR! execute error: Failed to merge in the changes.
lerna ERR! execute CONFLICT (content): Merge conflict in [file]
```

#### Solution

Run `lerna import` with the `--flatten` flag to import the history in "flat"
mode, i.e. with each merge commit as a single change the merge introduced.

### Failing when git tree has uncommitted changes

You will receive `fatal: ambiguous argument 'HEAD':` error, when the current project has **uncommitted changes**.

#### Solution

Make sure to commit all the changes you have in your lerna project, before importing any packages using `lerna import`.

## Publish Command

### Publish does not detect manually created tags in fixed mode with Github/Github Enterprise

Github and Github Enterprise use lightweight Git tags when a release is created through the [web ui](https://help.github.com/articles/working-with-tags),
while Lerna uses annotated tags.

This can cause an issue where Lerna will ignore previously published releases which have been manually performed and
tagged with the Github web ui.

For example if the publish history was as follows:

- v1.1.0 was published and tagged with `lerna publish`
- v1.2.0 was manually published and tagged with the Github web ui
- v1.2.1 was manually published and tagged with the Github web ui

Running `lerna publish` now would detect v1.1.0 instead of v1.2.1 as the last released tag.

The implications of this depends on your usage of `lerna publish`:

- The publish prompt would use v1.1.0 as the base for major/minor/patch suggestions.
- When using the --conventional-commits flag:
  - would suggest a semver increment based on all the commits since v1.1.0 (including commits from v1.2.0, v1.2.1 etc)
  - The generated CHANGELOG.md files will repeat all the commits that have already been released in v1.2.0, v1.2.1 etc

#### Solution:

If possible, use `lerna publish` over manual releases.

For new manual releases, use `git tag -a -m <version>` instead of using the Github web ui.

For existing lightweight tags, they can be converted to an annotated tag using something like this:

```sh
GIT_AUTHOR_NAME="$(git show $1 --format=%aN -s)"
GIT_AUTHOR_EMAIL="$(git show $1 --format=%aE -s)"
GIT_AUTHOR_DATE="$(git show $1 --format=%aD -s)"
GIT_COMMITTER_NAME="$(git show $1 --format=%cN -s)"
GIT_COMMITTER_EMAIL="$(git show $1 --format=%cE -s)"
GIT_COMMITTER_DATE="$(git show $1 --format=%cD -s)"

git tag -a -m $1 -f $1 $1

git push --tags --force
```

See this [Stackoverflow post](https://stackoverflow.com/questions/5002555/can-a-lightweight-tag-be-converted-to-an-annotated-tag) for more details

### Publishing to a private npm registry (Artifactory, npm Enterprise, etc)

If `lerna publish` is failing ensure you have the following your `package.json`:

```javascript
	"publishConfig": {
		"registry": "https://[registry-url]"
	}
```

You may also need to add the following to your `.npmrc` file on the individual package(s):

```
registry = https://[registry-url]
```
