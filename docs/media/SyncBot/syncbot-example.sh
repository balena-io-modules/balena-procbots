#!/usr/bin/env bash

# Rebuild the transpiled code
clear
npm install
rm -rf ./build
gulp build

# Select which bots to boot
export PROCBOT_BOTS_TO_LOAD="syncbot"

export SYNCBOT_MAPPINGS="[
    [
        { \"service\": \"blah\", \"flow\": \"blah\" },
        { \"service\": \"blah\", \"flow\": \"blah\" },
        { \"service\": \"blah\", \"flow\": \"blah\" }
    ]
]"
# Service to use to access details provided by the user
export SYNCBOT_HUB_SERVICE="blah"
# Accounts to use as substitutes when no configured account is found
export SYNCBOT_GENERIC_AUTHOR_ACCOUNTS="{
    \"blah\": {
        \"user\": \"...\",
        \"token\": \"...\"
    }
}"
# Accounts to use to report system messages
export SYNCBOT_SYSTEM_MESSAGE_ACCOUNTS="{
    \"blah\": {
        \"user\": \"...\",
        \"token\": \"...\"
    },
    \"blah\": {
        \"user\": \"...\",
        \"token\": \"...\"
    }
}"
# Account that are equivalent, despite different usernames
export SYNCBOT_ACCOUNTS_WITH_DIFFERING_USERNAMES="[
    { \"serviceA\": \"blah\", \"serviceB\": \"bleh\" }
]"


# Details for the Discourse adapter
export SYNCBOT_DISCOURSE_CONSTRUCTOR_OBJECT="{
    \"token\": \"...\",
    \"username\": \"...\",
    \"instance\": \"...\"
}"

export SYNCBOT_FLOWDOCK_CONSTRUCTOR_OBJECT="{
    \"organization\": \"...\",
    \"token\": \"...\"
}"

export SYNCBOT_FRONT_CONSTRUCTOR_OBJECT="{
    \"token\": \"...\",
    \"inbox_channels\": {
        \"inb_blah\": \"cha_blah\"
    }
}"

# Details for the Message Translator hub
export MESSAGE_TRANSLATOR_PRIVATE_INDICATORS="[\"💭\"]"
export MESSAGE_TRANSLATOR_PUBLIC_INDICATORS="[\"💬\", \"%\"]"

# Do the thing
npm start
