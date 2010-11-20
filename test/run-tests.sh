#!/bin/sh
cd `dirname $0`

if [ -d ../tmp ]; then
    rm -rf ../tmp
fi

mkdir ../tmp
mkdir ../tmp/test

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

    cp -R . ../tmp
    ../scoop.js -o ../tmp .
    cp ../../scooj/scooj.js ../tmp
    $MODJEWEL/module2transportd.py -o ../tmp --htmlFile test-driver.html --htmlMain "require('tests-node')" ../tmp
    cp $MODJEWEL/modjewel-require.js ../tmp

    echo to run the tests, open ../tmp/test-driver.html in your browser

fi

../scoop.js -o ../tmp .

NODE_PATH=..:. ./test-scoop-file.js

NODE_PATH=        node ../tmp/node-util.js
NODE_PATH=../tmp  node tests-node.js

