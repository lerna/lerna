#!/usr/bin/env bash

SCRIPT_DIR=$(dirname "$0")

# pwd when running the command should be the e2e directory
if [ $SCRIPT_DIR != "." ]; then
  echo "Error: This script must be run from the e2e directory"
  exit 1
fi

VERSION=$1
NPM_REGISTRY=`npm config get registry`

if [ -z "$VERSION" ]; then
  echo "Error: You must provide a version number to publish as the first positional argument"
  exit 1
fi

if [[ ! $NPM_REGISTRY == http://localhost* ]]; then
  echo "Error: $NPM_REGISTRY does not look like a local registry - exiting"
  exit 1;
fi

# Change to the prepared dist directory
cd ../dist

echo "Updating the package versions in $(pwd) to use $VERSION"

echo ""

echo "Running npx lerna version $VERSION --exact --force-publish --no-git-tag-version --no-push --no-changelog --yes"

echo ""

npx lerna version $VERSION --exact --force-publish --no-git-tag-version --no-push --no-changelog --yes

echo ""

echo "Publishing all relevant packages to $NPM_REGISTRY"

echo ""

npx lerna publish from-package --registry="http://localhost:4872/" --yes

echo ""

echo "Publishing complete"
