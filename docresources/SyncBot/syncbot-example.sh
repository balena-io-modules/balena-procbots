#!/usr/bin/env bash

# Rebuild the transpiled code
clear
npm install
rm -rf ./build
gulp build

export PROCBOT_BOTS_TO_LOAD="syncbot"

export SYNCBOT_PORT="4567"
export SYNCBOT_NAME="blahbot"
export SYNCBOT_DATAHUB_CONSTRUCTORS="{
    \"simple\": {
        \"blahbot_discourse_token\": \"blah\",
        \"blahbot_discourse_username\": \"blahbot\",
        \"generic_flowdock_token\": \"blah\"
    },
    \"flowdock\": {
        \"organization\": \"blah\",
        \"token\": \"blah\"
    }
}"
export SYNCBOT_MAPPINGS="[
    [
        { \"service\": \"discourse\", \"flow\": \"blah\" },
        { \"service\": \"flowdock\", \"flow\": \"blah\" },
        { \"service\": \"front\", \"flow\": \"blah\" }
    ]
]"
export SYNCBOT_LISTENER_CONSTRUCTORS="{
    \"flowdock\": {
        \"organization\": \"blah\",
        \"token\": \"blah\"
    },
    \"front\": {
        \"token\": \"blah\",
        \"channelPerInbox\": {
            \"blah\": \"blah\"
        }
    },
    \"discourse\": {
        \"instance\": \"blah\",
        \"username\": \"blah\",
        \"token\": \"blah\"
    }
}"

export MESSAGE_TRANSLATOR_PRIVACY_INDICATORS="{
    \"hidden\": {
        \"word\":\"whisper\",
        \"char\":\"~\"
    },
    \"shown\": {
        \"word\":\"comment\",
        \"char\":\"%\"
    }
}"
export MESSAGE_TRANSLATOR_ANCHOR_BASE_URL="https://resin.io"
export SYNCBOT_ERROR_UNDOCUMENTED="No fixes currently documented."
export SYNCBOT_ERROR_SOLUTIONS="{
    \"discourse\": {
        \"^403\": { \"description\": \"permissions error\", \"fixes\": [
            \"You should check that your username and token are correct.\"
        ] }
    }
}"

npm start
