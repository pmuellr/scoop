#!/bin/sh
cd `dirname $0`

if [ -d tmp ]; then
    rm -rf tmp
fi

mkdir tmp
mkdir tmp/test

if [ -z $MODJEWEL ]; then
    echo "The MODJEWEL environment variable is not set, skipping those tests."
fi

if [ ! -z $MODJEWEL ]; then

    if [ ! -d $MODJEWEL ]; then
        echo "The MODJEWEL environment variable is not set to a directory."
        exit
    fi

    if [ ! -x $MODJEWEL/module2transportd.py ]; then
        echo "The MODJEWEL environment variable is not set to the right directory."
        exit
    fi

    cp node_modules/scooj.js tmp
    $MODJEWEL/module2transportd.py -o tmp tmp

fi

node scoopc.js -o tmp    test
node scoopc.js -o tmp -t test

NODE_PATH=test:.:node_modules test/test-scoop-file.js

NODE_PATH=node_modules      node tmp/test/node-util.js
NODE_PATH=node_modules:tmp  node test/tests-node.js

if [ ! -z $MODJEWEL ]; then

    OLD=test/test-browser-template.html
    NEW=tmp/test-browser.html
    sed "s!__MODJEWEL__!../$MODJEWEL!" <$OLD >$NEW

    echo
    echo to run the tests, open $NEW in your browser

fi