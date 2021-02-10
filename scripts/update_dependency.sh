#!/bin/sh

# if you wanted to execute this script in a shell loop based on, say, npm outdated results (YMMV on cut depth for slashes):
# for pkg in $(npm outdated -p | cut -d ':' -f 1 | cut -d '/' -f 7-); do ./scripts/update_dependency.sh $pkg --no-install; done

if [ "$#" -lt 1 ]; then
    echo >&2 "Usage: $0 package-name [--no-install]"
    exit 1
fi

# brew install ripgrep jq sponge
command -v jq >/dev/null 2>&1 || { echo >&2 "jq is required. brew install jq"; exit 1; }
command -v rg >/dev/null 2>&1 || { echo >&2 "rg is required. brew install ripgrep"; exit 1; }
command -v sponge >/dev/null 2>&1 || { echo >&2 "sponge is required. brew install sponge"; exit 1; }

TARGET="$1"
INFILES=$(rg --sort=path --files-with-matches --glob package.json --glob '!__fixtures__' --fixed-strings '"'$TARGET'":')

if [ "$INFILES" == "" ]; then
    echo >&2 "No packages found with dependency '$TARGET'"
    exit 0
fi

echo "Updating package: '$TARGET'"

LATEST=$(npm v "$TARGET" version)
LATEST="^$LATEST"

echo "...using version: '$LATEST'"

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

if [ "$2" != "--no-install" ]; then
  npm install
  git add -u .
  npm home $TARGET --no-browser
fi
