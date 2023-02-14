set -e

DIR=$(dirname "$0")
ONLY=$1

if [ "$ONLY" == "--update-snapshots" ] || [ "$ONLY" == "-u" ]; then
    ONLY=""
    UPDATE_SNAPSHOTS=true
else
    UPDATE_SNAPSHOTS=$2
    if [ "$UPDATE_SNAPSHOTS" == "--update-snapshots" ] || [ "$UPDATE_SNAPSHOTS" == "-u" ]; then
        UPDATE_SNAPSHOTS=true
    fi
fi

for subdir in $DIR/*
do
    if [ -d "$subdir" ]; then
        # If ONLY is not set, run the tests for the current suite
        if [ -z "$ONLY" ]; then
            echo ""
            $subdir/exec.sh $UPDATE_SNAPSHOTS
        fi
        # If ONLY is set and the basename of subdir is equal to ONLY, run the tests for the current suite
        if [ "$ONLY" == "$(basename $subdir)" ]; then
            echo ""
            $subdir/exec.sh $UPDATE_SNAPSHOTS
        fi
    fi
done
