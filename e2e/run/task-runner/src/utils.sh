function initializeFixture {
  DIR=$1

  SUITE=$(basename $DIR)

  echo "⌛️ Initializing Fixture for $SUITE...\n"

  # Initialize the E2E_ROOT and capture the generated path
  E2E_ROOT=$(npx ts-node tools/scripts/set-e2e-root.ts)

  # Initialize the Fixture and capture the generated fixture root path
  FIXTURE_ROOT_PATH=$(E2E_ROOT=$E2E_ROOT npx ts-node --project $DIR/../../tsconfig.lib.json -r tsconfig-paths/register $DIR/init.ts)

  # Switch into the generated Fixture's lerna workspace and prepare the outputs directory
  cd $FIXTURE_ROOT_PATH/lerna-workspace

  OUTPUTS="node_modules/.lerna-test-outputs"
  mkdir -p $OUTPUTS
}

function runAssertions {
  DIR=$1
  E2E_ROOT=$2
  FIXTURE_ROOT_PATH=$3
  UPDATE_SNAPSHOTS=$4

  SUITE=$(basename $DIR)

  # Switch back to the original directory
  cd - >/dev/null

  # If UPDATE_SNAPSHOTS is set, update the snapshots, else run the assertions
  if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
    echo "⌛️ Updating Snapshots for $SUITE...\n"
    FIXTURE_ROOT_PATH=$FIXTURE_ROOT_PATH E2E_ROOT=$E2E_ROOT npx jest --config $DIR/../../jest.config.ts $DIR/assertions.spec.ts -u
  else
    echo "⌛️ Running Assertions for $SUITE...\n"
    FIXTURE_ROOT_PATH=$FIXTURE_ROOT_PATH E2E_ROOT=$E2E_ROOT npx jest --config $DIR/../../jest.config.ts $DIR/assertions.spec.ts
  fi
}
