DIR=$(dirname "$0")
UPDATE_SNAPSHOTS=$1

# Inline the bash util functions
source "$DIR/../utils.sh"

# Initialize the Fixture and modify the generated fixture root path
declare FIXTURE_ROOT_PATH
initializeFixture $DIR

# Run the relevant task runner commands and write stdout and stderr to a named file in each case (for later assertions)
npx lerna run print-name > $OUTPUTS/print-name.txt 2>&1
npx lerna run print-name --parallel > $OUTPUTS/print-name-parallel.txt 2>&1
npx lerna run print-name --sort > $OUTPUTS/print-name-sort.txt 2>&1
npx lerna run print-name --no-sort > $OUTPUTS/print-name-no-sort.txt 2>&1
npx lerna run print-name --include-dependencies > $OUTPUTS/print-name-include-dependencies.txt 2>&1

# Run the assertions
runAssertions $DIR $E2E_ROOT $FIXTURE_ROOT_PATH $UPDATE_SNAPSHOTS
