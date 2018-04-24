# VersionBot

VersionBot is a CI tool designed to help engineers with PRs, linting commits, ensuring reviews have been made by appropriate Github users and finally bumping the version of a component when it's merged to the `master` branch. In brief, it will:

* Look for new PRs and check that there is at least one commit in the PR which features a suitable `Change-Type:` tag
* Look for required status checks (such as other CI systems) that fail, and then alert the author of the PR
* Prevent manual merging of a PR using a 'AutoMerge' status check
* Suppress any warnings (or merging) for a PR should it find the `flow/in-progress` label. This allows Work-In-Progress to occur with minimal interruptions by VersionBot.
* Look for PR review approvals ***and*** a label applied to the PR to mark it ready for merge (`procbots/versionbot/ready-to-merge`)
* On seeing appropriate label and review, will automatically:
    1. Clone the PR branch for the repo
    2. Run `versionist` upon it. Should a `versionist.conf.js` config file exist in the root of the repo, then this is used in preference to the in-built default config.
    3. Should a new version be generated, commit any appropriate files (eg. `CHANGELOG.md`, `package.json`) to the branch
    4. Merge the branch back into the head
    5. Delete the PR branch

If a PR branch is out of step with the `master` branch, `VersionBot` will refuse to merge (and will not update the versions of files).

Merges and checks can be suppressed using the `procbots/versionbot/no-checks` label on a PR.

## Creating a Github Integration

Follow the instructions on [making a GitHub integration](https://github.com/resin-io-modules/resin-procbots/blob/master/docresources/Services/GitHub/integration.md#creating-a-github-integration)
with the following notes:

* The Webhook Path should be `/webhooks`.
* The Webhook Port should be `4567`.
* The Permissions it needs are:
	- Repository metadata: R/O
	- Repository administration: R/O
	- Commit statuses: R/W
		# Status
	- Deployments: R/W
		# Deployment
		# Deployment status
	- Issues:
		# Issue comment: R/W
		# Issues: R/W
	- Pull Requests: R/W
		# Pull request
		# Pull request review
		# Pull request review comment
	- Repository contents: R/W
		# Commit comment
		# Create
		# Delete
		# Fork
		# Push
		# Release


## Secret Key, Webhook Token and Integration ID

`VersionBot` requires the following environment variables:

* `VERSIONBOT_WEBHOOK_SECRET`: The 20 digit hex key used to authenticate messages.
* `VERSIONBOT_INTEGRATION_ID`: The ID given on Integration creation, a unique identifier.
* `VERSIONBOT_PEM`: The Base64 encoded private key generated on Integration creation.
* `VERSIONBOT_NAME`: The name shown in commits and merges for PRs by the Integration.
* `VERSIONBOT_EMAIL`: Email address for the bot, (can be an empty string).
* `VERSIONBOT_USER`: Can be an empty string.

By default `VersionBot` will listen on port 4567, but this can be overriden using the `VERSIONBOT_LISTEN_PORT` environment variable.

You'll need to fill these fields out in `.vscode/launch.json` before debugging (if you're running this on the CLI, set envvars accordingly). If you're running on Resin, these must be set as Application envvars.

Ask Heds how this works if unsure.

## Initialising a Repo

Before the Versionist ProcBot can deal with a repository, the repo itself needs to be updated to support it.

Use the tool in `tools/initRepo` to setup the repository in such a way that the `master` branch is guarded and merges can only occur post-review and with a `procbots/versionbot/ready-to-merge` label:

    ./tools/initRepo/bin/initRepo -u bob -p bobspassword -r bob/bobsrepo

Alternatively, go to the `Settings` page for the repo, select `Branches` and then `Protected branches`, choose the `master` branch and then turn on at least the following:

    [x] Protect this branch
        [x] Require pull request reviews before merging
    [x] Require status checks to pass before merging
        [x] Require branches to be up to date before merging
        Status checks:
        [x] Versionist
        [x] Reviewers
        [x] AutoMerges

The status checks won't be visible until VersionBot has operated on the repo for the first time. Come back after the rest of these steps.

**Note:** This must be carried out by an admin user of the repo, in this case `bob`.

Ensure you also create the `procbots/versionbot/ready-to-merge` and `procbots/versionbot/no-checks` label types in the 'Issues' section of the repo (this will be added to the tool).

Finally you need to install the Github App into the repo. Do this by going to your 'Settings' page for the Github App (as above), selecting the appropriate App and then selecting the 'Your installations' tab. Hit the cog to the right of the organisation name, and then add the repos you want VersionBot to run on in the `Repository access` section. Remember to hit `Save`.

### Tailoring VersionBot for a Repo via Configuration File

This is a file with the name `repository.yml` in a relative location for the ProcBot running. In the case of VersionBot, this is in the root of the repository that it is working on, on the `master` branch.

ProcBots itself has a single property, `minimum_version`, which is checked to ensure that operations only get carried out should that version be satisfied. Should it not find itself to be of at least the minimum version, an error is thrown.

Example:

```
procbot:
    minimum_version: 0.5
```


#### Maintainer and Reviewer Configuration

A list of valid maintainers and approved reviewers may be defined to allow VersionBot to vet those Github users who are providing review approval.

The definition for these users in the configuration file is as follows:

````
minimum-approvals: <number>
reviewers:
    - <list of Github user names>
maintainers:
    - <list of Github user names>
````

* `minimum-approvals`[optional] - Denotes the minimum number of approvals required for a PR
* `reviewers`[optional] - A list of Github user names whose reviews count towards an approval total
* `maintainers`[optional] - A list of Github user names whose reviews count towards an approval total, of which at *least* one must be a maintainer in this list

The functionality is as follows:
* If a `reviewers` list exists, then reviews counting towards `minimum-approvals`
    can only be met by reviewers in that list (and `maintainers`)
* If a `maintainers` list exists, then at least one review must be from a maintainer:
    * If a maintainer created the PR *and* there are no other maintainers, then reviews
    from `reviewers` (if it exists) are required to make up the `minimum-approvals`
    * If a maintainer created the PR and there *are* other maintainers, then one of the
    remaining `maintainers` must approve the PR
* If no `reviewers` list exists, anyone can approve; if a `maintainers` list exists
    then at least one `maintainer` must approve
* For any named reviewer/maintainers not added when a PR is opened, VersionBot will
    request that they add themselves on the PR as reviewers

Example:

```
minimum-approvals: 1
reviewers:
    - githubuser
maintainers
    - githubmaintainer
```

#### Required Tags in PR Commits

This functionality allows repository maintainers to determine which footer tags in
a PR are mandatory or optional.
Tags keys are considered case insensitive, and optionally may define how many
occurences should be present in all of the commits for a PR, as well as defining
valid values.

The `change-type` tag is *always* assumed to be present, regardless of other
tag definitions. Should the configuration file redefine the `change-type` tag,
then that definition will override the inbuilt one.

The following shows how to format required tag definitions in the `repository.yml`
configuration:

```
required-tags:
    <tagname>:
        occurrence: 'all' | 'once' | 'never'
        values: <regexp body>
```

Both the `occurrence` and `values` properties are optional, if present:
* `occurrence`[optional] - Determines how many occurrences of the tag should occur within a
                          PR. Valued values are:
                          * `once` - The tag should occur in at least one commit in the PR
                          * `all` - The tag should occur in every commit in the PR
                          * `never` - The tag should never occur in any commit in the PR
* `values`[optional] - A regular expression body defining a tag's valid values.
            This body should be defined to match values that occur after a tag prefix, and
            should exclude the leading and trailing solidus from the expression. Bodies
            will always be suffixed with a `$` when compiled, which ensures that a value
            can only exist on a single line.
            Defaults to `.*` should it not be defined.
* `flags`[optional] - Only valid (and parsed) should the `values` property be present.
                      This is a string consisting of the regular expression flags that
                      pertain to the regular expression body defined in the `values`
                      property. Valid values are: `i`, `u` and `y`. The `g` and `m`
                      flags have no meaningful value in the tests and will be ignored.

As an example, the following is a valid set of definitions for a repository,
and includes the `change-type` tag explicitly.

```
required-tags:
    signed-off-by:
        occurrence: all
    changelog-entry:
        occurrence: never
    change-type:
        occurrence: once
        values: \s*(patch|minor|major)\s*
        flags: i
```

## Running VersionBot

Currently there is only one ProcBot, VersionBot. You can run this from within Visual Code by building and then debugging in the usual way, or you can run it from the command line:

`./bin/procbot -b versionbot`

This allows the checking of commits for a PR and merging them when the right labels/conditions are met.

`VersionBot` will ignore any status checks and not attempt to merge should the `procbots/versionbot/no-checks` label be present on any PR it would otherwise operate on when a PR is opened.

Currently, `VersionBot` will:
* Version up only once all status checks set as 'Required' on protected branches for 'master' are successful
* The `procbots/versionbot/ready-to-merge` label is present

VersionBot can be configured via a `.procbots.yml` file present in any repository that it operates on. This alters the settings for it for working on that repository. Currently the configuration for VersionBot consists of the following properties:

    `procbot.versionbot.maintainers` - A list of Github user names that are authorised maintainers of the repository. The `procbots/versionbot/ready-to-merge` label will only be acted upon should a maintainer in this list have added the label.

Example (**NB:** This will soon be changing format):

```
procbot:
    minimum_version: 0.5
    versionbot:
        maintainers:
            - lekkas
            - hedss
```

**Some Notes:**
* Should `VersionBot` come across a situation where it does not know how to proceed, it will comment on the PR as such. This can include instances where the `procbot/versionbot/ready-to-merge` label has been added without checks completing. In this case, await the checks to be successful and then reapply the label.
