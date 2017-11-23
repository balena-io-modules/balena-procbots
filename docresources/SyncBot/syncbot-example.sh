#!/usr/bin/env bash

# Rebuild the transpiled code
clear
npm install
rm -rf ./build
gulp build

export PROCBOT_BOTS_TO_LOAD="syncbot"
export SYNCBOT_CONFIG_TO_LOAD="configs/syncbot_test.yml"

export SYNCBOT_DISCOURSE_SECRET="blah"
export SYNCBOT_DISCOURSE_TOKEN="blah"
export SYNCBOT_FLOWDOCK_TOKEN="blah"
export SYNCBOT_FRONT_SECRET="blah"
export SYNCBOT_FRONT_TOKEN="blah.blah.blah"
export SYNCBOT_NAME="syncbot"
export SYNCBOT_PORT="4567"

npm start
