#!/usr/bin/env bash

# pwd should be the root of the workspace
if [ ! -f ./lerna.json ]; then
  echo "Error: This script must be run from the root of the workspace"
  exit 1
fi
workspaceRoot=$(pwd)

cp ./e2e/lerna.json.localpublish ./dist/lerna.json
cp ./e2e/package.json.localpublish ./dist/package.json
