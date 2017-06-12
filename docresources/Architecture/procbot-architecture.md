---
---
# Introduction

Several operations carried out by Resin.io are suitable for automatic execution based on, for example, repository changes. The implementation of these automated processes are from this point onwards referred to as 'Bots'. Some examples of bots include:

* Checking to ensure the commit/PR process has been followed correctly, before version bumping a component and merging that PR to the `master` branch
* Taking conversations from multiple sources (eg. Front, Discourse, Flowdock) and allow responses from Flowdock
* Notifying customers once an issue they have raised with Resin has been addressed and rolled out to production

This document details the architecture behind ProcBots, and how to write one. Current implementation examples include VersionBot and SyncBot.

## Top Level Architecture

To understand the architecture, it is important to refer to portions of it. Relevant terms are:

* ProcBot - The base TypeScript class that all Client bots inherit from. This class forms the framework allowing Client Bots to listen to, and send data to, Services
* ServiceListener - A listener for events that are directed to it by an external service (such as the Webhooks from Github) and that packages that data into a format suitable to be sent to a Client
* ServiceEmitter - An emitter of data (the `ServiceEmitRequest` object) passed to it by a Client for an external service (again, such as via the Github API). ServiceEmitters can return responses to requests via the `ServiceEmitResponse` object
* Client Bot - The 'Bot' designed to carry out the automated process. It takes `ServiceEvent` objects sent to it by ServiceListeners, carries out the task required, and sends any relevant data on via a `ServiceEmitRequest` to ServiceEmitters. Client Bots can use any emitter as API conduits if they wish (ie. to send a request and receive a response directly from the relevant service)

Therefore, every ProcBot is comprised of:

* A ProcBot base client which allows the addition of ServiceListeners and ServiceEmitters
* A specific Client class which inherits from the ProcBot and carries out the designated series of operations that form the action
* Zero or more ServiceListeners that take events from an external source and process them into a suitable format (a ServiceEvent) before sending them to the Client
* Zero or more ServiceEmitters that takes a ServiceEmitRequest and uses appropriate APIs to send data (and return any responses to that send via a ServiceEmitResponse) to a Service

The diagram below shows a potential setup of a ProcBot system:

![Procbots Architecture](Procbots-Architecture.png)

To understand in detail how these components interact, we need to delve deeper into them.

## Detailed Components

### `ProcBot` Class

The `ProcBot` class acts a base framework that allows Client Bots to inherit from them a set of basic methods that prevent the same functionality from having to be recreated in every new Bot.

This functionality includes:

* The addition of ServiceListener and ServiceEmitters to a Client Bot
* The dispatching of `ServiceEmitRequest` objects to one or more ServiceEmitters (or all), as well as returning the `ServiceEmitResponse` objects from these calls
* Handling the acquisition and processing of configuration files for a Client Bot

### ServiceListeners

Every ServiceListener corresponds to a unique, external service which receives arbitrary data asynchronously (for example data from  Webhooks). Each ServiceListener has a unique name designated by its filename in the `lib/services` directory.

It is the role of the ServiceListener to:

* Receive asynchronous data and process it into a suitable `ServiceEvent` object ready to be send to the Client
* Allow the registration of Client Bots using a registration structure that details the events the Client Bot wishes to receive
* Queue calls to the registered Client Bot by a context

Events are passed to Client Bots via the `ServiceEvent` object:

```
{
    cookedEvent: a processed event into a specific format for consumption
    rawEvent: the raw payload data that was received by the ServiceListener
    source: the name of the Service passing the data to the Client, eg. 'github'
}
```

ServiceListeners can determine the amount of information a Client Bot needs to provide in order to determine whether a received event is passed to the Client or not. The minimum amount of information is that of a `ServiceRegistration` object, which includes:

* The name of action that pertains to the registration (for example, 'ValidPullRequest' might be used as the name for a Client Bot registering a need for a Github pull request that fits certain criteria)
* The events required by the registration. This is an array of event names
* The method in the Client Bot to call when events matching the registration criteria are received and ready to be processed

A Client Bot may make multiple registrations with a single ServiceListener, each detailing a separate set of events and methods to call with the event data. This allows a Client Bot to act different depending on the event data received.

It can be seen that by extending `ServiceRegistration` object, a ServiceListener could filter events being received so that very strict match criteria could be applied, thus ensuring Client Bots only ever receive the exact events they are interested in.

ServiceListeners are also responisible for ensuring that events received are, if required, queued by context. This ensures, for example in the case of the Github service, that multiple events pertaining to the same repository are carried out in chronological order regardless of how many other events are received. This performs a sort of psuedo-threading model, which allows events for independant repositories to be enacted upon as soon as the previous relevant event has been processed.

### Workers, WorkerClient Bots and Concurrency

It is the case with many ServiceListeners that events may or may not be related. It is also the case that consistency and ordering for particular events is important.

Take for example, two different types of event being passed to a service. Each has a key and a value, one type of value being a text string, and the other a string of numbers. The role of the Client Bot is to send these onwards to another service which simply prints them out on different terminals (per key) as they are received. Consider the following individual events are received in order by the ServiceListener:

```
456: 1234567890
456: 1234
123: ABCDEFGHIJKLMNOPQRSTUVWXYZ
123: ABCDEFGHIJKLMN
456: 12
123: ABCDEF
```

Should the ServiceListener simply pass on each event and not consider its ordering, with the Client Bot calling the ServiceEmitter for each of them and not waiting for a response acknowledging that the message has been recorded, then it's entirely possible that the final recorded print order might look something like this:

```
123:
ABCDEFGHIJKLMN
ABCDEF
ABCDEFGHIJKLMNOPQRSTUVWXYZ

456:
1234
1234567890
12
```

These are now out of order, and not the desired output.

Obviously this has potentially disasterous consquences depending on the data being processed. However, similarly, we do not want to wait for the completion of events that are not related as this slows execution.

Workers are designed to solve the concurrency issue presented here by allowing a ServiceListener to define a context for the events that they receive. Events that are related are serialised, ensuring that any processing and emitting is carried out completely for an event before the next event in the context is operated upon, but ensuring that separate events can also be processed asynchronously to achieve a suitable throughput.

Workers and WorkerClient Bots are instrumental to achieving event handling based on context.

Whenever a ServiceListener receives a new event from an external source, it uses methods in the WorkerClient to queue the event into the relevant context. This is carried out by the ServiceListener implementing a method that creates a new Worker should a relevant context not already exist, or retrieving a current Worker should a Worker for the context already exist. The WorkerClient then adds the passed event to that Worker. WorkerClient Bots hold a map of each Worker along with the value of its context.

The Worker class itself stores, in order of reception, all current events that have been queued based on a specific context. This context is a generic type and could be anything; a string, a number, an object, etc.

Workers are self-regulating; every time an event has been processed by a Client Bot the Worker will check to see if there are anymore events to pass to a Client. It will do this until the queue is empty and then remove itself from the map of Workers held in the WorkerClient.

ServiceListeners all rely on the WorkerClient class to perform the context duties for queueing new events.

### ServiceEmitters

ServiceEmitters act as a Client Bots ability to send data to external services. This may be a simple 'dumb' fire and forget, or the act of using an API to request data and receive responses.

Every ServiceEmitter expects a `ServiceEmitRequest` object which holds data allowing it to communicate relevant to the external service it acts as an arbiter for. As a `ServiceEmitRequest` object could potentially be passed to many ServiceEmitters, the `ServiceEmitRequest` include a `contexts` property, which should contain a unique property name for each service (whose key name is that service) that the Client Bot wishes to use, the value of which is an object that allows a ServiceEmitter to make requests to its respective external service.

For example, the Github service expects to be given a function and data to pass to that function to make calls to the Github API. To achieve this, a Client Bot needs to pass a `ServiceEmitRequest` with the following structure:

```
{
    contexts: {
        'github': {
            method: <githubFunction>
            data: <githubData>
        }
    },
    source: 'myClientBot'
}
```

ServiceEmitters always return a Promise containing any relevant response from the sending of data in a `ServiceEmitResponse`:

```
{
    response?: any;
    err?: Error;
}
```

This allows a Client Bot to act appropriately.

### Utilities

Utility classes can be used by any Client Bot and/or Service. Currently the `Logger` class exists to allow components to create logging/alerting messages should they need to.

## Writing New Client Bots

The role of a Client Bot is simplistic:

1. Receive a suitable event
2. Act upon that event
3. Finish

For this reason, every Client Bot requires the use of at least one ServiceListener. It may also require the use of a ServiceEmitter should it need to pass further data on (and generally, Client Bots are fairly useless if they don't).

Client Bots are stateless. They should expect no ability to store data within them persistently from one event to the next. That is, they should not expect prior knowledge when dealing with a new event. That said, there is no reason why a Client Bot may not make use of an external persistence storage mechanism as part of its execution flow when acting upon an event. Such a storage mechanism might be a database (such as Postgres or MongoDB) or a cache (such as Redis). This could easily be achieved using a ServiceEmitter that talks to one of these storage mechanisms.

The general flow of a Client Bot is:

1. Add any required ServiceListeners via the `addServiceListener()` method (inherited from the ProcBot class)
2. Add any required ServiceEmitters via the `addServiceEmitter()` method (inherited from the ProcBot class)
3. Register for events of interest via the ServiceListener's `registerEvent()` method, passing any suitable `ServiceRegistration` derived object suitable for that ServiceListener. A `ServiceListenerMethod` is specified in this object as the method in the Client Bot to call for a particular event
4. Receive an event from a ServiceListener as a `ServiceEvent` passed to the `ServiceListenerMethod` defined in the `ServiceRegistration` object for that particular event
5. Act upon that event, calling any ServiceEmitter as required
6. Clean up and return

To ensure that serialisation of events for a particular context occurs correctly, it is imperative that the Client Bot does not signal the end of the execution flow before it has finished acting upon the event passed to it. All Client Bots must use a `ServiceListenerMethod` type as the method to call with a `ServiceEvent`. This method type returns a `Promise<void>` as its return type. The fulfillment of this Promise is used to indicate that a Client Bot has finished acting upon the event and is potentially ready for another in that context. Note that the Client Bot could still be called with an event in a separate context concurrently whilst this occurs.

A good example of a Client Bot is the 'VersionBot', found in `lib/bots/versionbot.ts`.

## Writing New Services

A Service can consist of a ServiceListener, ServiceEmitter or both. Each Service is defined as a TypeScript source file in the `lib/services` directory, and exposes a method for each type of Service it defines, which is utilised as a `ServiceFactory` object:

```
interface ServiceFactory {
    createServiceListener: (data: any) => ServiceListener;
    createServiceEmitter: (data: any) => ServiceEmitter;
}
```

The ProcBot class instantiates new services when requested (by `addServiceListener()` or `addServiceEmitter()`) by using the name of the source file in the `lib/services` directory as a `require`d module. Therefore the exposing of the `createServiceListener()` and/or `createServiceEmitter()` is then used as a `ServiceFactory`.

Both of the creation methods must return a new instantiation of the relevant Service class. However, this is not to say that the same class cannot be used as both a ServiceListener and a ServiceEmitter, and indeed the 'github' service exposes itself as both, mutating depending on the type of constructor object passed into it.

#### ServiceListeners

ServiceListeners must always `extend` a WorkerClient to ensure serialisation of events per context. They must also `implement` the ServiceListener interface.

ServiceListeners are responsible for receiving events from an external service (using any mechanism they so chose), and then processing that event into a more suitable structure (if required) for passing to a Client Bot. The general flow is as follows:

1. ServiceListener is constructed and uses a suitable API to receive events
2. Client Bots register for events via the `registerEvent()` method, passing in a suitable registration object. This structure is based off a `ServiceRegistration` object and must always specify the events required and a method to call when such an event is ready to be passed to it
3. An event is received by the ServiceListener. The ServiceListener now processes this event and 'cooks' it into a suitable `ServiceEvent` based object, also attaching the 'raw' event to it. It then calls the `queueEvent()` method inherited from the WorkerClient class.
4. The WorkerClient will attempt to get a Worker for the event based on context. This is achieved by calling the `getWorkers()` method which is implemented by the ServiceListener. This method derives a context given the event, and fetches an appropriate Worker for it
5. The event is pushed onto the relevant Workers queue ready for relaying in order
6. For each event in a Worker queue, the method attached to the ServiceEvent is called and the Worker waits until it completes. The next even in the queue is then called until all events for that Worker are exhausted

ServiceListeners must, therefore, also implement the Worker classes `getWorkers()` method, which ensures that suitable contexts can be created for events being received from an external service.

If required, they must also override the `removeWorker()` method should any Service specific data for that context need destroying before the context is removed.

A good example is the 'github' Service, which utilises the full names of a repository as a context to ensure that operations on those repositories happen strictly in the order required. All events received for `hedss/my_repo` are processed fully in order before the next, but processing of events for any other repo, say `hedss/other_repo` can also occur at the same time.

#### ServiceEmitters

ServiceEmitters have a single method, `sendData()`, which requires a `ServiceEmitRequest` object to denote the contexts which data should be sent to. They only act on contexts which share a property key that matches their own service.

Responses to any data sent in a `sendData()` request is returned via a `ServiceEmitResponse` object, which can contain a valid response or an error. To ensure a Client Bot knows which ServiceEmitter corresponds to which response or error, the ServiceEmitter sets its name in the `source` property of the returned object.

The general flow is as follows:

1. Client Bot creates a `ServiceEmitRequest` object and sets a context property for each ServiceEmitter it wishes to send data via
2. It calls the `dispatchToEmitter()` or `dispatchToAllEmitters()` method passing the `ServiceEmitRequest`
3. Any relevant ServiceEmitter is then called with this object, and it inspects it for a relevant context (ie. a context with the same property key name as itself)
4. It makes a request to an external service using an relevant API and, if required, awaits a response
5. And response or error received is noted in a new `ServiceEmitResponse` object, which includes the name of the ServiceEmitter in the `source` property, this object is then returned
6. The Client Bot receives one or an array of `ServiceEmitResponse` objects, with a returned payload or error

Again, see the 'github' Service for an example of how ServiceEmitters work.

## Current Services

### ServiceListeners

#### github

Context: String denoting full name of full Github repository (eg. `resin-io/resin-procbots`)

Source: `lib/services/github.ts`

Types: `lib/services/github-types.d.ts`

Constructor: `GithubListenerConstructor`
```
{
    client: name of the Client Bot
    loginType: credentials for the Github service (either a GithubIntegration or GithubUser object)
    path: path which the Github webhook expects to call
    port: port the Github Webhook expects to call
    type: 'listener'
    webhookSecret: secret passphrase that Github encodes payloads with
}
```
ServiceEvent Cooked Data: `GithubCookedData`
```
{
    data: the data payload received by the 'github' service
    githubApi: a reference to a the Github API (see below)
    githubAuthToken: the auth token used by the Github API as a string
    type: the event type as a string
}
```
Notes: As the 'github' service implements both a ServiceListener and a ServiceEmitter, the `type` field must be set to `listener` to allow the instantiation of a ServiceListener.

The 'github' service allows the aquisition of events via a Webhook from Github. It implements an HTTPS service via 'Express' using the details passed in the constructor object passed on a call to `addServiceListener('github', constructor)` by a ClientBot.

Client Bots can register for specific Github events by utilising the `GithubRegistration` structure:
```
{
    name: name of the Client Bot
    events: an array of Github Webhook event names
    listenerMethod: GithubListenerMethod
    suppressionLabels?: an array of strings pertaining to issue labels
    triggerLabels?: an array of strings pertaining to issue labels
}
```

Webhook event names can be found on [this Github page](https://developer.github.com/v3/activity/events/types/).

Omission of the `suppressionLabels` and `triggerLabels` properties will ensure that all events registered events are passed to the Client Bot. As the context for this ServiceListener is the full repository name, events received for the same repository name are queued and executed chronologically for that repository. Events received for other repositories are executed upon when available using the same algorithm.

`triggerLabels` and `suppressionLabels`, if present in the `GithubRegistration` object, pertains to the following events:

* `issue_comment`
* `issues`
* `pull_request`
* `pull_request_review`
* `pull_request_review_comment`

For these events, if all of the `triggerLabels` are discovered **and** none of the labels in the `suppressionLabels` array are found, then events are passed to the Client Bot.

The event data passed back includes a cooked version, passed as a `GithubCookedData` object. This object is self-explanatory, but includes both a reference to the JS Github API library (see [here](https://github.com/mikedeboer/node-github)) and the auth token used to authenticate with it (for allowing future calls). This information can then be used to send `ServiceEmitRequest` calls to the `github` ServiceEmitter, if required.

### ServiceEmitters

#### github

Source: `lib/services/github.ts`

Types: `lib/services/github-types.d.ts`

Constructor:
```
{
    client: name of the Client Bot
    loginType: credentials for the Github service (either a GithubIntegration or GithubUser object)
    type: 'emitter'
}
```
Notes: As the 'github' service implements both a ServiceListener and a ServiceEmitter, the `type` field must be set to `emitter` to allow the instantiation of a ServiceEmitter.

The 'github' ServiceEmitter makes use of the JS Github API Library (see [here](https://github.com/mikedeboer/node-github)) to send data to Github. This API expects to be passed a method to call as well as data relevant to that method. This is passed as a `github` context in the `ServiceEmitRequest` object:
```
'github': {
    method: Github API Method
    data: Github API Data
}
```

The `lib/apis/githubapi-types.d.ts` declaration file has a set of pre-annotated types ready for use as values for the `data` property.
