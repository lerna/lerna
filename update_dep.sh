#!/bin/sh

# brew install ripgrep jq sponge

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
