#!/usr/bin/env bash

# For now we do not do anything within the build process other than make a copy of the source
# and put it in a root dist/ directory

# pwd should be the root of the workspace
if [ ! -f ./lerna.json ]; then
  echo "Error: This script must be run from the root of the workspace"
  exit 1
fi
workspaceRoot=$(pwd)

# Teardown any old outputs
rm -rf ./dist

# Build any packages which require a build step
npx nx run-many -t build

# Resolve the packages using lerna itself
IFS=$'\n' read -d '' -a packageLocations < <((./node_modules/node-jq/bin/jq -c -r '.[].location') <<<"$(npx lerna list --json)")

for packageLocation in "${packageLocations[@]}"; do
  newLocation=$(echo "./dist/${packageLocation#${workspaceRoot}/}/")
  mkdir -p $newLocation
  cp -R $packageLocation/. $newLocation/.
done

echo "Successfully copied all ${#packageLocations[@]} packages to ./dist"

