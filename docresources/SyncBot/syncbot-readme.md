# SyncBot

A little Bot, using the ProcBot framework, that links communication services

## How do I use SyncBot?

### How do I set up my accounts?

* Ensure your Front, Discourse and Flowdock usernames are mappable
    * Your Github username should work fine in Flowdock.
    * Your Github username, with underscores instead of hyphens, should work fine in Discourse.
    * Your Github username, with a trailing hyphen becoming a leading underscore, should work fine in Front.
    * `Hubot, suggest username` will suggest options based on your Flowdock handle, or a provided string.
* Ask a Discourse admin to make you a moderator
* Test your link
  * [test thread](https://www.flowdock.com/app/rulemotion/user_happiness/threads/XY9ykgPS8EFABsLL57aCXMRxf44)
    this is an unlisted thread which can be used to test your Discourse details
    with SyncBot. SyncBot will complain if there is an error, otherwise stay
    silent.

### Which entities are linked?

* Flows
  * Forums:Troubleshooting -> Flowdock:s/support_forums -> Front:S/Forums
  * Front:S/Paid_Support -> Flowdock:s/support_premium 
  * Front:S/Device_Support -> Flowdock:s/support_premium
  * Front:z/leads -> Flowdock:r/leads
* Threads
  * A new thread in a source flow will become a new linked thread in a destination flow
* Comments
  * Public comments in linked threads get synchronised
    * Flowdock doesn't natively support private/public distinction, so use `>` as the first character to indicate the comment is public
  * Private comments remain private, but are synchronised
    * Uses discourse's `whisper`
    * Uses front's `comment`
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

### Setting up a Front inbox for SyncBot

1) You will need the help of a Front admin to perform the first steps,
and someone with write access to this repo to perform the final step
1) Ensure that the SyncBot account has access to the inbox on Settings >
Inboxes > ...inbox... > Teammates
1) Get the Front API token from Settings > Plugins and API > API
1) Fire a request similar to the following to acquire a list of inboxes
	```
	GET https://api2.frontapp.com/inboxes
	Accept: application/json
	Authorization: Bearer a.b.c
	```
1) Find the ID of the inbox you care about, should be in the format `inb_abc`.
1) Create a custom channel for the inbox in Settings > Inboxes > ...inbox... > Add a Channel
	```
	Enable undo send = false
	Auto-assign on reply = false
	API endpoints outgoing = https://your.syncbot.url/front-dev-null
	```
1) Note the channel id, `cha_abc` from incoming url in API Endpoints
1) Add the inbox to the `SyncBot <- Inboxes` rule.  The settings for the rule should be as follows:
	```text
	WHEN:
		<Inbound message, Outbound message, Outbound reply, Comment, Mention, Conversation assigned, Conversation unassigned, Conversation archived, Conversation reopened, Conversation moved>
	IF <at least one> CONDITION IS MET:
		- <Inbox is> <synchronised inbox>
		- <Inbox is> <synchronised inbox>
		- <Inbox is> <synchronised inbox>
	THEN:
		<Send to a Webhook> <https://your.deploy/front>
	```
1) Adjust the following values in configs/yml
	* `SYNCBOT_MAPPINGS`
		* Add the flow mapping to the array
	* `SYNCBOT_LISTENER_CONSTRUCTORS.front.channelPerInbox`
		* Add the map of inbox to channel to the array

### Setting up a Discourse category for SyncBot

1) You will need the help of a Discourse admin (not moderator) to perform the
first steps, and someone with write access to this repo to perform the final step
1) Get an All Users API Key from https://your.discourse/admin/api/keys
1) Fire a request similar to the following to acquire a list of categories
	```
	GET https://your.discourse/categories
	?api_key=<key>
	&api_username=<username>
	Accept: application/json
	```
1) Find the ID of the category you care about, should be in the format `123`.
1) Create a webhook at https://your.discourse/admin/api/web_hooks, the settings should be as follows:
	```text
	Payload URL:
		<https://your.deploy/discourse>
	Content Type:
		<application/json>
	Secret:
		<some_secret_here>
	Which events should trigger this webhook?
		<Select individual events.>
			<Post Event>
	Triggered Categories
		<empty list>
	Triggered Groups
		<empty list>
	Check TLS certificate of payload url
		<checked>
	Active
		<checked>
	```
1) Adjust the following values in configs/yml
	* `SYNCBOT_MAPPINGS`
		* Add the flow mapping to the array

### Setting up a Github org for SyncBot

Follow the instructions on [making a GitHub integration](https://github.com/resin-io-modules/resin-procbots/blob/master/docresources/Services/GitHub/integration.md#creating-a-github-integration)
with the following notes:

* The Webhook Domain and Port depend on your server installation.
  These should be available from your server documentation (in Resin, the
  `keyframe`) or DevOps team.
* The Webhook Path should be `/github`
* The Permissions it needs are:
	* Repository metadata: R/O
	* Issues: R/W
	* Pull requests: R/W
* The Subscriptions it needs are:
	* Issues
	* Pull request
	* Issue comment
	* Pull request review
	* Pull request review comment

### Setting up a Github repo for SyncBot

1) Add the repo in the Org's Settings > Applications > Configure > Repository access
1) Note the name and org of the repo, these will be needed to set up the routing
1) Configure the route into the codebase in `configs/syncbot_*.yml/SYNCBOT_MAPPINGS`,
  example format available in syncbot_example.yml
1) Ensure the notes from setting up the integration are provided by your
  server environment, often managed via a DevOps team.

### Example configuration files

* There is an example .yml file in the same directory as this file that gives
an example of configuring the bot.
* There is an example .sh file in the same directory as this file that gives
a sanitised example of providing secrets via the environment.

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

#### SYNCBOT_ARCHIVE_STRINGS

This is a list of strings that, when whispered, should archive a ticket

e.g.
```yaml
- "#teardown"
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
        "hidden": "whisper",
        "shown": "reply"
    }
}
```

#### SYNCBOT_NAME

This is the username of the account under which syncbot should operate.

e.g. `syncbot`

#### SYNCBOT_PORT

This is an integer value for which port the web hooks should listen to.

e.g. `4567`

## Managing SyncBot via a Chat Interface

SyncBot is configured to accept management commands from a chat interface using `SYNCBOT_DEVOPS_FLOW` and `SYNCBOT_DEVOPS_USERS`. This allows a list of users (stored as the hash of the username) to perform tasks upon SyncBot within the configured flow.

### Syntax

1) Begin with `@syncbot`
1) Follow with any number of filters or queries
   * A filter is `object.property=value` and checks against simple non-function properties before queries are processed
   * A query is `object.property` and reports on the result, executing if relevant
   * You may shortcut access to the `process` object by omitting `object`

For example `@syncbot pid=1 process.uptime system.uptime` will instruct the SyncBot with PID 1 to tell you how long its process and system have been running.

A more nuclear example is `@syncbot exit` which will kill all running SyncBot processes.

### Entities

The entities that may be interacted with are:
* `process` - [the npm process object](https://www.npmjs.com/package/process)
* `system` - [the npm os object](https://www.npmjs.com/package/os)
* `package` - the package.json

Note that properties used in a filter (`x.y=z`) are never executed, but that functions in an query will be (`x.y`).
