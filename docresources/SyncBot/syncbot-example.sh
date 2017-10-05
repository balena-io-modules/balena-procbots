#!/usr/bin/env bash

# Rebuild the transpiled code
clear
npm install
rm -rf ./build
gulp build

export PROCBOT_BOTS_TO_LOAD="syncbot"

export SYNCBOT_PORT="4567"
export SYNCBOT_NAME="blah"
export SYNCBOT_DATAHUB_CONSTRUCTORS="{
    \"simple\": {
        \"testbot_discourse_token\": \"blah\",
        \"testbot_discourse_username\": \"blah\",
        \"testbot_flowdock_token\": \"blah\"
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
        \"emoji\":\"💭\",
        \"word\":\"whisper\",
        \"char\":\"~\"
    },
    \"shown\": {
        \"emoji\":\"💬\",
        \"word\":\"comment\",
        \"char\":\"%\"
    }
}"
export MESSAGE_TRANSLATOR_MESSAGES_OF_THE_DAY="[\"resin.io\"]"
export MESSAGE_TRANSLATOR_IMG_BASE_URL="https://resin.io/icons/logo.svg"

npm start
