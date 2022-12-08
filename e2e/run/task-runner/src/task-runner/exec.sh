DIR=$(dirname "$0")
UPDATE_SNAPSHOTS=$1

# Inline the bash util functions
source "$DIR/../utils.sh"

# Initialize the Fixture and modify the generated fixture root path
declare FIXTURE_ROOT_PATH
initializeFixture $DIR

# Run the relevant task runner commands and write stdout and stderr to a named file in each case (for later assertions)
npx lerna run print-name -- --silent > $OUTPUTS/all-child-packages.txt 2>&1
npx lerna run print-name --stream --concurrency=1 -- --silent > $OUTPUTS/stream.txt 2>&1
npx lerna run print-name --parallel -- --silent > $OUTPUTS/parallel.txt 2>&1
npx lerna run print-name --no-prefix --parallel -- --silent > $OUTPUTS/no-prefix-parallel.txt 2>&1
npx lerna run print-name --no-prefix --concurrency=1 --stream -- --silent > $OUTPUTS/no-prefix-stream.txt 2>&1
npx lerna run print-name --profile -- --silent > $OUTPUTS/profile.txt 2>&1
npx lerna run print-name --profile --profile-location=profiles -- --silent > $OUTPUTS/profile-custom-location.txt 2>&1
npx lerna run print-name --npm-client=yarn > $OUTPUTS/npm-client-yarn.txt 2>&1
npx lerna run print-name --ci > $OUTPUTS/ci.txt 2>&1

# Run the assertions
runAssertions $DIR $FIXTURE_ROOT_PATH $UPDATE_SNAPSHOTS
