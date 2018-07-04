# `@lerna/filter-options`

> Options for lerna sub-commands that need filtering

## Usage

`--scope`

Include only packages with names matching the given glob.

`--ignore`

Exclude packages with names matching the given glob.

`--no-private`

Exclude private packages. They are included by default.

`--since [ref]`

Only include packages that have been updated since the specified `ref`. If no ref is passed, it defaults to the most-recent tag.

`--include-filtered-dependents`

Include all transitive dependents when running a command regardless of `--scope`, `--ignore`, or `--since`.

`--include-filtered-dependencies`

Include all transitive dependencies when running a command regardless of `--scope`, `--ignore`, or `--since`.
