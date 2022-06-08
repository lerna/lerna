#!/usr/bin/env bash

SCRIPT_DIR=$(dirname "$0")

# pwd when running the command should be the e2e directory
if [ $SCRIPT_DIR != "." ]; then
  echo "Error: This script must be run from the e2e directory"
  exit 1
fi

cp ./lerna.json.localpublish ../dist/lerna.json
cp ./package.json.localpublish ../dist/package.json
