#!/usr/bin/env bash

# Rebuild the transpiled code
clear
npm install
rm -rf ./build
gulp build

export PROCBOT_BOTS_TO_LOAD="syncbot"
export CONFIG_TO_LOAD="syncbot_test"
export SYNCBOT_PORT="4567"
export SYNCBOT_NAME="blahbot"
export SYNCBOT_LISTENER_CONSTRUCTORS="{
    \"flowdock\": {
        \"organization\": \"blah\",
        \"token\": \"blah\"
    },
    \"front\": {
        \"secret\": \"blah\",
        \"token\": \"blah\",
        \"channelPerInbox\": {
            \"blah\": \"blah\"
        }
    },
    \"discourse\": {
        \"instance\": \"blah\",
        \"username\": \"blah\",
        \"secret\": \"blah\",
        \"token\": \"blah\"
    }
}"
npm start
