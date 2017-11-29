# SyncBot

A little Bot, using the ProcBot framework, that links communication services

## How do I use SyncBot?

### How do I set up my accounts?

* Ensure your Front, Discourse and Flowdock usernames are mappable
    * Your Github username should work fine in Flowdock.
    * Your Github username, with underscores instead of hyphens, should work fine in Discourse.
    * Your Github username, with a trailing hyphen becoming a leading underscore, should work fine in Front.
    * `Hubot, suggest username` will suggest options based on your Flowdock handle, or a provided string.
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
  * Forums:Troubleshooting - Flowdock:public/s/community - Front:support/community
  * Flowdock:public/s/premium - Front:support/premium
* Comments
  * Public comments in linked threads get synchronised
    * Use a `%` or `💬` at the beginning of a line to indicate the comment is
      public
  * Private comments remain private, but are synchronised
    * Uses discourse's `whisper`
    * Uses front's `comment`
    * Without syntax, private is assumed
* Threads
  * Public threads in linked flows get synchronised
    * Use a `%` or `💬` at the beginning of a line to indicate the topic is
      public
  * Private threads remain private, but are synchronised
    * Uses discourse's `unlisted`
    * Without syntax, private is assumed

## What usernames are valid?

### Currently used github username conventions

fsurname
forenames
forenamesurname123
ForenameSurname
fms
forename-surname
nickname
ForenameSn
surnamefn
forenamesurname
Nickname-
forenamesn
sorenamefurname
Forename-Surname
Nickname
nickname123

### Services

(If you follow all of the rules in bold, then you follow all the rules)

#### GitHub

Taken, in part, from https://github.com/join

* **Must begin with: an alphanumeric.**
* **Must only contain: alphanumeric or hyphens.**
* Must end with: an alphanumeric (or hyphen, if legacy).
* **Consecutive special characters: forbidden.**
* Maximum: 39 characters.
* Minimum: 1 character.
* Collision avoidance: ignores case.

#### Front

* Must begin with: lower case alphanumeric or underscore.
* **Must only contain: lower case alphanumeric or underscores.**
* Must end with: lower case alphanumeric or underscore.
* **Consecutive special characters: forbidden.**
* Maximum: In excess of 39 characters.
* Minimum: 1 character.
* Collision avoidance: ignores case.
* API username: ignores case.

#### Flowdock

* Must begin with: alphanumeric, hyphen, dot or underscore.
* Must only contain: alphanumeric, hyphens, dots and underscores.
* Must end with: alphanumeric, hyphen, dot or underscore.
* Consecutive special characters: allowed.
* Maximum: In excess of 39 characters.
* Minimum: 1 character.
* Collision avoidance: ignores case.
* API username: ignores case.

#### Discourse

* Must begin with: alphanumeric or underscore.
* Must only contain: alphanumeric, hyphens, dots and underscores.
* **Must end with: alphanumeric.**
* **Consecutive special characters: forbidden.**
* **Maximum: 20 characters.**
* **Minimum: 3 characters.**
* Collision avoidance: ignores case.
* API username: ignores case.

### Intersections

* Regexes given for GitHub usernames that can be migrated.
* Throughout this I have assumed the best to be "as close to github as possible".

#### Strict

`/^[a-z0-9]{3,20}$/`

* Must only contain lower case alphanumerics.
* Maximum is 20 characters.
* Minimum is 3 characters.

Breaks for ForenameSurname, forename-surname, FornameSn, Nickname-, Forename-Surname, Nickname

#### Smart

* When considering whether two users are equivalent, cast username to lower case.
    * It's fine, they all have a case insensitive username lookups.
* When translating to and from Flowdock, it's fine.
    * Flowdock is a strict superset of GitHub.
* When translating to and from Front: swap hyphens and underscores.
    * Both Front and GitHub have exactly one non-alphanumeric character they support.  They just disagree about which one.
* When translating to and from Discourse: make trailing hyphen a leading underscore.
    * Discourse allows underscore on the beginning but not the end.  GitHub allows hyphen on the end but not the beginning.

`^[a-zA-Z0-9][a-zA-Z0-9\-]{1,19}$`

* Must begin with: an alphanumeric.
* Must only contain: alphanumeric or hyphens.

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

#### PROCBOT_BOTS_TO_LOAD

This is a string of the names of the bots that need loading by this deployment
of ProcBots.

e.g. `syncbot`

#### SYNCBOT_CONFIG_TO_LOAD

This is a string defining a path of a file, that may contain INJECTS, to load as config

e.g. `configs/syncbot_test.yml`

#### INJECT

In the config file leaf nodes may be `<<INJECT_BLAH>>` which will translate to the value
of `BLAH` from the environment

### configs/*.yml

#### SYNCBOT_ALIAS_USERS

This is a list of user accounts that syncbot should represent using its own identity

e.g.
```json
["hubot"]
```

#### SYNCBOT_ERROR_SOLUTIONS

This is a JSON encoded object of error patterns, a user friendly description, and possible fixes.

e.g.
```json
{
  "discourse": {
    "^403": { "description": "a problem with your permissions.", "fixes": [
      "You should check that your username and token are correct."
    ] },
    "^500": { "description": "a problem with the discourse servers.", "fixes": [
      "You should try again in a few minutes."
    ] }
  }
}
```

#### SYNCBOT_ERROR_UNDOCUMENTED

This is a text string to use when the error translator cannot find any details.

e.g. `No fixes currently documented.`

#### SYNCBOT_LISTENER_CONSTRUCTORS

This is a list of the construction requirements of each service that SyncBot
listens to.

e.g.
```json
{
  "flowdock": {
    "organization": "blah",
    "token": "blah"
  },
  "front": {
    "secret": "blah",
    "token": "blah",
    "channelPerInbox": {
      "blah": "blah"
    }
  },
  "discourse": {
    "instance": "blah",
    "username": "blah",
    "token": "blah"
  }
}
```

#### SYNCBOT_MAPPINGS

This is a list of the edges that define a directed graph of flows, along which threads should be synchronised.
Messages within each thread are synchronised bidirectionally.
Creation of a thread is synchronised directionally.

e.g.
```json
[
  {
    "source": { "service": "discourse", "flow": "blah" },
    "destination": { "service": "flowdock", "flow": "blah" }
  },
  {
    "source": { "service": "flowdock", "flow": "blah" },
    "destination": { "service": "discourse", "flow": "blah" }
  },
  {
    "source": { "service": "front", "flow": "blah" },
    "destination": { "service": "flowdock", "flow": "blah" }
  },
  {
    "source": { "service": "flowdock", "flow": "blah" },
    "destination": { "service": "front", "flow": "blah" }
  }
]
```

#### SYNCBOT_METADATA_CONFIG

This is a JSON object that specifies how metadata is to be encoded.

e.g.
```json
{
    "baseUrl": "https://resin.io",
    "publicity": {
        "hidden": {
            "word":" whisper",
            "char": "~"
        },
        "shown": {
            "word": "comment",
            "char": "%"
        }
    }
}
```

#### SYNCBOT_NAME

This is the username of the account under which syncbot should operate.

e.g. `syncbot`

#### SYNCBOT_PORT

This is an integer value for which port the web hooks should listen to.

e.g. `4567`
