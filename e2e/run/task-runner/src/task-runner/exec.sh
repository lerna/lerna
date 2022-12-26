DIR=$(dirname "$0")
UPDATE_SNAPSHOTS=$1

# Inline the bash util functions
source "$DIR/../utils.sh"

# Initialize the Fixture and modify the generated fixture root path
declare FIXTURE_ROOT_PATH
declare E2E_ROOT
initializeFixture $DIR

# Run the relevant task runner commands and write stdout and stderr to a named file in each case (for later assertions)
npx lerna run print-name > $OUTPUTS/all-child-packages.txt 2>&1
npx lerna run print-name --stream --concurrency=1 > $OUTPUTS/stream.txt 2>&1
npx lerna run print-name --parallel > $OUTPUTS/parallel.txt 2>&1
npx lerna run print-name --no-prefix --parallel > $OUTPUTS/no-prefix-parallel.txt 2>&1
npx lerna run print-name --no-prefix --concurrency=1 --stream > $OUTPUTS/no-prefix-stream.txt 2>&1
npx lerna run print-name --profile > $OUTPUTS/profile.txt 2>&1
npx lerna run print-name --profile --profile-location=profiles > $OUTPUTS/profile-custom-location.txt 2>&1
npx lerna run print-name --npm-client=yarn > $OUTPUTS/npm-client-yarn.txt 2>&1
npx lerna run print-name --ci > $OUTPUTS/ci.txt 2>&1

# Run the assertions
runAssertions $DIR $E2E_ROOT $FIXTURE_ROOT_PATH $UPDATE_SNAPSHOTS
