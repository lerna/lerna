#!/bin/sh

if [ "$#" -ne 1 ]; then
    echo >&2 "Usage: $0 package-name"
    exit 1
fi

# brew install ripgrep jq sponge
command -v jq >/dev/null 2>&1 || { echo >&2 "jq is required. brew install jq"; exit 1; }
command -v rg >/dev/null 2>&1 || { echo >&2 "rg is required. brew install ripgrep"; exit 1; }
command -v sponge >/dev/null 2>&1 || { echo >&2 "sponge is required. brew install sponge"; exit 1; }

TARGET="$1"

echo "Updating package: '$TARGET'"

LATEST=$(npm v "$TARGET" version)
LATEST="^$LATEST"

echo "...using version: '$LATEST'"

INFILES=$(rg --sort=path --files-with-matches --glob package.json --glob '!__fixtures__' --fixed-strings '"'$TARGET'":')

echo "located in files:"
echo $INFILES
echo

for file in $INFILES; do
    cat $file | \
        jq \
            --arg pkg "$TARGET" \
            --arg ver "$LATEST" \
            '.dependencies[$pkg] = $ver' \
        | sponge $file;
    echo "Finished editing: $file"
done

npm install
git add -u .
npm home $TARGET --no-browser
