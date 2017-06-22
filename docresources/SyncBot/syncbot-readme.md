# SyncBot

A little Bot, using the ProcBot framework, that links communication services

## How do I use SyncBot?

### How do I set up my accounts?

* Attempt the following:
  * Ensure your Front, Discourse and Flowdock usernames match
* If you cannot:
  * Let the SyncBot maintenance and deployment team know your usernames don't
    align
* Get your discourse details
  * Attempt the following:
    * Sign-in to forums.resin.io
    * Go to your preferences page (top right profile picture > cog icon)
    * Go to your admin page (top right spanner labelled admin)
    * Under permissions generate an API key
  * If you cannot:
    * Ask a Discourse admin to:
      * Make you a moderator
      * Generate an API key for you
* Give your discourse details to SyncBot
  * Send the following PM's to the SyncBot account:
    * `My discourse token is ...`
  * Do not be surprised by the lack of response
    * Syncbot searches when required rather than constantly listening
    * Testing and confirming receipt will be developed
* Test your link
  * [test thread](https://www.flowdock.com/app/rulemotion/user_happiness/threads/XY9ykgPS8EFABsLL57aCXMRxf44)
    this is an unlisted thread which can be used to test your Discourse details
    with SyncBot. SyncBot will complain if there is an error, otherwise stay
    silent.

### Which entities are linked?

* Flows
  * Forums:Troubleshooting - Flowdock:public/s/community - 
    Front:support/community
  * Flowdock:public/s/premium - Front:support/premium (TBC)
* Threads
  * Public threads in linked flows get synchronised
    * Use a `%` or `💬` at the beginning of a line to indicate the topic is
      public
  * Private threads remain private, but are synchronised
    * Uses discourse's `unlisted`
    * Without syntax, private is assumed
* Comments
  * Public comments in linked threads get synchronised
    * Use a `%` or `💬` at the beginning of a line to indicate the comment is
      public
  * Private comments remain private, but are synchronised
    * Uses discourse's `whisper`
    * Uses front's `comment`
    * Without syntax, private is assumed

## How does SyncBot work?

### Each event

1) Listener receives an event
1) SyncBot routes the event
   1) Listener transforms the event into a message
   1) SyncBot gathers information for the message transmission
      1) Asks the Listener if there's a connected thread
      1) Username is copied from the existing message details
      1) Finds a token
         1) in the 1-1 history with the user on the hub service
         1) in the configuration otherwise, for the public posting
   1) Emitter transforms the message into a payload
1) Emitter emits the payload
1) SyncBot deals with aftermath
    1) Connects newly created threads
       1) SyncBot generates special connection messages
       1) Conversion to payload and emission happen as normal
    1) Logs the success to the console
    1) Reports any errors to the originating thread

### Specific details

#### Front receives an event

The Front service is configured to send events from the configured inboxes
via webhook.  These events are then added to the queue for their thread.

#### Front transforms the event into a message

The Front adapter gathers the full event, calculates whether it's the first in
a thread and which inbox it happened in, bundling this into a generic format.

#### Front transforms the message into a payload

The Front adapter builds a new conversation, message or comment payload,
depending on what it is given.

#### Front emits the payload

The Front adapter passes to the Front API the payload and passes back some
basic details.

#### Discourse receives an event

The Discourse service is configured to send events from the configured
categories via webhook.  These events are then added to the queue for their
topic.

#### Discourse transforms the event into a message

The Discourse adapter gathers more complete topic and post information,
bundling this into a generic format.

#### Discourse transforms the message into a payload

The Discourse adapter builds a new topic or post payload, depending on what it
is given.

#### Discourse emits the payload

The Discourse adapter passes to the Discourse API the payload and passes back
some basic details.

#### Flowdock receives an event

A Flowdock session is bought online when SyncBot starts, connects to the
configured rooms and puts any events on the queue for their thread.

#### Flowdock transforms the event into a message

The Flowdock adapter gathers details of the username, and alongside the decent
details Flowdock provides to the connection bundles it into a generic format

#### Flowdock transforms the message into a payload

The Flowdock adapter creates a new message payload.  This is actually fairly
simple because one object structure supports all of our purposes.

#### Flowdock emits the payload

The Flowdock adapter passes to the Front API the payload and passes back some
basic details

#### Listener is quizzed for connected thread

The listener looks back through the message history for a message that matches
"Connects to {service} thread blah" and returns the blah

#### Username is copied from the existing message details

At this stage usernames across services must match.  This is so that SyncBot
knows which user's 1-1 history to search for details.  In future this could
become configurable, in a similar way to flows.

#### Flowdock is quizzed for token

Flowdock will search the 1-1 history of a user for a phrase that matches "My
{service} token is blah", returning blah

#### Error reporting

Errors, where possible, are reported in the originating thread as whispers.

## How would I configure SyncBot?

### Example .sh file

There is an example .sh file in the same directory as this file, that gives
some sanitised examples of configuration.

### Environment Variables

#### MESSAGE_CONVERTOR_PRIVATE_INDICATORS

This is a JSON encoded array of strings that may be used to indicate that a
message is private.

e.g. `\["💭"]`

#### MESSAGE_CONVERTOR_PUBLIC_INDICATORS

This is a JSON encoded array of strings that may be used to indicate that a
message is public.

e.g. `\["💬", "%"]`

#### MESSAGE_SERVICE_PORT

This is an integer value for which port the web hooks should listen to.

e.g. `4567`

#### SYNCBOT_GENERIC_AUTHOR_ACCOUNTS

These are a set of accounts that the bot may use when a message originates from
a user that is not configured, i.e. the public.

e.g.
```json
{
  "flowdock":{"user":"SyncBot","token":""},
  "discourse":{"user":"SyncBot","token":""},
  "front":{"user":"SyncBot","token":""}
}
```

#### SYNCBOT_SYSTEM_MESSAGE_ACCOUNTS

These are a set of accounts that the bot may use for system messages, i.e.
`Connects to ...`

e.g.
```json
{
  "flowdock":{"user":"SyncBot","token":""},
  "discourse":{"user":"SyncBot","token":""},
  "front":{"user":"SyncBot","token":""}
}
```

#### SYNCBOT_HUB_SERVICE

This is a service that the bot may use to search for user-linked values, i.e.
`My ... token is ...`

e.g. `flowdock`

#### SYNCBOT_DISCOURSE_CONSTRUCTOR_OBJECT

This is an object containing all the details that Discourse requires to
configure an adapter, including which account listens to the topics.

e.g.
```json
{
  "instance":"forums.resin.io",
  "token":"",
  "username":"SyncBot"
}
```

#### SYNCBOT_FLOWDOCK_CONSTRUCTOR_OBJECT
This is an object containing all the details that Flowdock requires to
configure an adapter.

e.g.
```json
{
  "organization":"rulemotion",
  "token":""
}
```

#### SYNCBOT_FRONT_CONSTRUCTOR_OBJECT
This is an object containing all the details that Front requires to configure
an adapter, including which channel to use to write to which inbox.

e.g.
```json
{
  "inbox_channels":{"":""},
  "token":""
}
```

#### SYNCBOT_MAPPINGS
This contains details of which flows are considered to be equivalent

e.g.
```json
[
  [
    {"service":"discourse","flow":""},
    {"service":"flowdock","flow":""},
    {"service":"front","flow":""}
  ],
  [
    {"service":"flowdock","flow":""},
    {"service":"front","flow":""}
  ]
]
```
