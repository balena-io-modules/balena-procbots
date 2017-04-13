# NotifyBot

NotifyBot is a CI tool designed to inform authors of PRs on a component when a version of that component containing the merged PR has been deployed to an environment (for example, Staging or Production). Additionally, it tracks issues associated with any deployed PR and comments on any linked Front topics (and by extension Front conversations attached to those topics) that the PR has been released, thus allowing Support agents to communicate that a reported issue or feature request is now available.

From version `3.7.0`, VersionBot now appends the PR number of source that has been merged to a component's `master` branch to the `CHANGELOG.md` file for that component. This allows NotifyBot to determine the PRs that have either been added or removed due to a version deploy.

When NotifyBot is alerted of an updated Keyframe (`keyframe.yml`) file in an environment repository, it carries out the following operations:

1. Scan the Keyframe file and make a note of every component whose version has changed, or that has been added to the Keyframe (NotifyBot will ignore components that have been removed)
2. For each component, make a note of the new version and compare it against the version from the previous Keyframe file. NotifyBot notes both increments in versions (ie. progressing version numbers) and decrements (ie. regressing version numbers)
3. Examine the changelog for each component whose version has changed, and determine the PRs which have been added/removed due to the version change
4. Comment upon the PR, informing the author of the PR that either:
  * The PR has now been deployed to the appropriate environment, should the version have incremented
  * The PR has now been removed from the appropriate environment, should the version have decremented
5. For each PR, it follows any attached repository local Issue and searches for any associated Front topics, as well as searching for linked HQ Issues, and searching for any associated Front topics with it. Searches occur in both the Issue description and in any comments. For each topic, either from the local Issue or from linked HQ Issues, it gathers a list of Front conversations and comments on them that either:
  * The PR derived from the associated Github Issue has now been deployed to the appropriate environment, and may fix an issue/add a feature should the component version have incremented
  * The PR dervied from the associated Github Issue has now been removed, and a fix/feature may have been removed

## Using NotifyBot

NotifyBot operates via Github webhook events, and needs to be installed upon repositories that represent a rollout environment.

### Adding Components to Keyframe Files

NotifyBot executes every time a Keyframe is merged to an environment repository's `master` branch. It examines every component and determines any change to the `version` field. It then gathers the PRs that have been added/removed due to the version change.

As such, any component that wishes to benefit from NotifyBot should, at the very least, include both version and repository location information in their component entry in a Keyframe, for example:

```
keyframe:
  components:
    my-component:
      version: v1.2.3
      repository: https://github.com/theowner/therepository
```

### Adding HQ Issues to Component Issues

Whilst NotifyBot will follow any associated Front topics in a local repository Issue, this is not the normal flow of support.

Usually, a customer reports an issue or requests a feature enhancement in Front and a new/existing Github Issue in HQ is associated with this request. Subsequently, Issues in components are then raised, and finally associated with a PR that fixes the issue/adds the feature.

To ensure that Front conversations are followed correctly, and where associating that conversation to the actual component repository Issue adds noise, a component Issue can be linked to the parent HQ Issue which is associated with the Front conversation. NotifyBot will follow this link and determine any Front topics (and therefore conversations) in the HQ issue and comment appropriately.

To do so, the following tag may be added to any component's Issue description or a comment within the Issue:
```
hq: <full URL of HQ Issue>
```

For example:

```
hq: https://github.com/theowner/hq/issues/1234
```

## Installing KeyframeBot

### Secret Key, Webhook Token and Integration ID

`KeyframeBot` requires the following environment variables:

* `NOTIFYBOT_GITHUB_WEBHOOK_SECRET`: The 20 digit hex key used to authenticate messages
* `NOTIFYBOT_GITHUB_INTEGRATION_ID`: The ID given on Integration creation, a unique identifier
* `NOTIFYBOT_GITHUB_PEM`: The Base64 encoded private key generated on Integration creation
* `NOTIFYBOT_NAME`: The name shown in commits and merges for PRs by the Integration
* `NOTIFYBOT_FRONT_API_KEY`: The Front API key used for communicating with the Service.
* `NOTIFYBOT_FRONT_USERNAME`: The Front username to comment on conversations as.

### Initialising a Repo

Before the KeyframeBot ProcBot can deal with a repository, both the product repo and environment repos themselves needs to be updated to support it.

Finally you need to install the Github App into the repo. Do this by going to your 'Settings' page for the Github App (as above), selecting the appropriate App and then selecting the 'Your installations' tab. Hit the cog to the right of the organisation name, and then add the environment repositories you want NotifyBot to run on in the `Repository access` section. Remember to hit `Save`.

### Tailoring ProcBots for a Repo via Configuration File

ProcBots now also respond to a configuration file. This is a file with the name `repository.yml` in a relative location for the ProcBot running. In the case of ProcBots operating on a Github repository (such as VersionBot), this is in the root of the repository that it is working on, on the `master` branch.

The configuration file uses a set of nested properties based on the class hierarchy of the ProcBots, with each class able to modify variables at run time from the configuration file.

ProcBots itself has a single property, `minimum_version`, which is checked to ensure that operations only get carried out should that version be satisfied. Should it not find itself to be of at least the minimum version, an error is thrown.

Example:

```
procbot:
    minimum_version: 0.5
```

Other bots are free to add any properties they require. It should be noted that all derived bots are able to view the entire configuration file on request.
