#!/usr/bin/env bash

# Rebuild the transpiled code
clear
npm install
rm -rf ./build
gulp build

# Select which bots to boot
export PROCBOT_BOTS_TO_LOAD="syncbot"

# Details for the Discourse adapter
export DISCOURSE_LISTENER_ACCOUNT_API_TOKEN="..."
export DISCOURSE_LISTENER_ACCOUNT_USERNAME="..."
export DISCOURSE_INSTANCE_URL="..."

# Details for the Flowdock adapter
export FLOWDOCK_ORGANIZATION_PARAMETERIZED_NAME="..."
export FLOWDOCK_LISTENER_ACCOUNT_API_TOKEN="..."

# Details for the Message Converter hub
export MESSAGE_CONVERTOR_PRIVATE_INDICATORS="[\"💭\"]"
export MESSAGE_CONVERTOR_PUBLIC_INDICATORS="[\"💬\", \"%\"]"

# Details for the SyncBot itself
# Event mappings for which events to synchronise between services
export SYNCBOT_EVENTS_TO_SYNCHRONISE="[
    {\"from\":\"...\", \"to\":\"...\", \"event\":\"...\"}
]"
# Room pairings, in the form source:source_id:target:target_id
export SYNCBOT_ROOMS_TO_SYNCHRONISE="{
    \"discourse\": {
        \"...\": {
            \"flowdock\":\"...\"
        }
    },
    \"flowdock\": {
        \"...\": {
            \"discourse\": \"...\"
        }
    }
}"
# Accounts to use as substitutes when no configured account is found
export SYNCBOT_GENERIC_AUTHOR_ACCOUNTS="{
    \"flowdock\": {
        \"user\": \"...\",
        \"token\": \"...\"
    }
}"
# Accounts to use to report system messages
export SYNCBOT_SYSTEM_MESSAGE_ACCOUNTS="{
    \"flowdock\": {
        \"user\": \"...\",
        \"token\": \"...\"
    },
    \"discourse\": {
        \"user\": \"...\",
        \"token\": \"...\"
    }
}"

# Do the thing
npm start
