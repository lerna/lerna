function initializeFixture {
  DIR=$1

  SUITE=$(basename $DIR)

  echo "⌛️ Initializing Fixture for $SUITE...\n"

  # Initialize the Fixture and capture the generated fixture root path
  FIXTURE_ROOT_PATH=$(npx ts-node --project $DIR/../../tsconfig.lib.json -r tsconfig-paths/register $DIR/init.ts)

  # Switch into the generated Fixture's lerna workspace and prepare the outputs directory
  cd $FIXTURE_ROOT_PATH/lerna-workspace

  OUTPUTS="node_modules/.lerna-test-outputs"
  mkdir -p $OUTPUTS
}

function runAssertions {
  DIR=$1
  FIXTURE_ROOT_PATH=$2
  UPDATE_SNAPSHOTS=$3

  SUITE=$(basename $DIR)

  # Switch back to the original directory
  cd - >/dev/null

  # If UPDATE_SNAPSHOTS is set, update the snapshots, else run the assertions
  if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
    echo "⌛️ Updating Snapshots for $SUITE...\n"
    FIXTURE_ROOT_PATH=$FIXTURE_ROOT_PATH npx jest --config $DIR/../../jest.config.ts $DIR -u
  else
    echo "⌛️ Running Assertions for $SUITE...\n"
    FIXTURE_ROOT_PATH=$FIXTURE_ROOT_PATH npx jest --config $DIR/../../jest.config.ts $DIR
  fi
}
