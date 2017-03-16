# procbots

Process bots used for automating the development and deployment CI pipeline.

Currently only the `VersionBot` exists. `VersionBot` will:

* Look for new PRs and check that there is at least one commit in the PR which features a suitable `Change-Type:` tag
* Look for PR review approval ***and*** a label applied to the PR to mark it ready for merge (`procbots/versionbot/ready-to-merge`)
* On seeing appropriate label and review, will automatically:
    1. Clone the PR branch for the repo
    2. Run `versionist` upon it. Should a `versionist.conf.js` config file exist in the root of
       the repo, then this is used in preference to the in-built default config.
    3. Should a new version be generated, commit any appropriate files (eg. `CHANGELOG.md`, `package.json`) to the branch
    4. Merge the branch back into the head
    5. Delete the PR branch

If a PR branch is out of step with the `master` branch, `VersionBot` will refuse to merge (and will not update the versions of files).

Merges and checks can be suppressed using the `procbots/versionbot/no-checks` label on a PR.

## Installation

`VersionBot` can be run either on a development machine (with suitable forwarding of a chosen callback URL to it's IP address) or in a `resin-on-resin` configuration.

### Host Development

`npm install` in root repo. You'll need to install modules before opening Visual Code (if using it) else it won't find the TypeScript defs it needs, and will moan at you.

`gulp build` or run Visual Code and build as per normal. There is an extra task for VC which will build the code before debugging.

Ensure your Internet router forwards traffic appropriately for any callback URL you use in the Integration setup to your host.

Appropriate environment variables are required before execution. See below.

### `resin-on-resin` Deployment

Create new app, add appropriate git remote for resin.io.

    gulp build
    git push resin master

Appropriate environment variables are required before execution. See below.

## Creating a Github Integration

`VersionBot` runs as an Integration in the Github scope. For development, you can create an Integration on your personal Github account by going to your Settings page (from your profile avatar icon) and selecting 'Integrations -> Register New Integration` from the 'Developer Settings' sidebar.

    * Give Integration a name
    * Set a Homepage URL (required but not used)
    * Set a callback URL (this is where all callbacks will go to, eg: `http://myurl.com:4567/webhooks`). Currently `VersionBot` expects webhooks to be sent to the `/webhooks` path when running, and listens on port `4567`
    * Create a new Webhook Secret (see [here](https://developer.github.com/webhooks/securing/)). You will require this secret later

    * Set up secure Webhooks:
        - Go to repository you want Integration on
        - Add a new secret
        - Add relevant code for HMAC digest in version bot and check again 'x-hub-signature' header entry for matching digest

Set the following permissions in 'Permissions & events':

    * Settings:
        - Repository metadata: R/O
        - Repository administration: R/O
        - Commit statues: R/W
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

Now hit 'Save'. The Integration will be created and you'll be given an Integration ID (note it down, it will be required later).

Finally you need to create a new private key for your Integration. Hit the 'Generate Private Key' in the 'Private Key' section.

Download the key and then create a Base64 string from it. It will be required later.

## Secret Key, Webhook Token and Integration ID

`VersionBot` requires the following environment variables:

    `VERSIONBOT_WEBHOOK_SECRET`: The 20 digit hex key used to authenticate messages.
    `VERSIONBOT_INTEGRATION_ID`: The ID given on Integration creation, a unique identifier.
    `VERSIONBOT_PROCBOTS_PEM`: The Base64 encoded private key generated on Integration creation.
    `VERSIONBOT_NAME`: The name shown in commits and merges for PRs by the Integration.
    `VERSIONBOT_EMAIL`: Email address for the bot, (can be an empty string).
    `VERSIONBOT_FLOWDOCK_ROOM`: The room ID whose inbox will be posted to. If not present, Flowdock will not be used.

You'll need to fill these fields out in `.vscode/launch.json` before debugging (if you're running this on the CLI, set envvars accordingly). If you're running on Resin, these must be set as Application envvars.

Ask Heds how this works if unsure.

## Initialising a Repo

Before the Versionist ProcBot can deal with a repository, the repo itself needs to be updated to support it.

Use the tool in `tools/initRepo` to setup the repository in such a way that the `master` branch is guarded and merges can only occur post-review and with a `procbots/versionbot/ready-to-merge` label:

    ./tools/initRepo/bin/initRepo -u bob -p bobspassword -r bob/bobsrepo

**Note:** This must be carried out by an admin user of the repo, in this case `bob`.

Ensure you also create the `procbots/versionbot/ready-to-merge` label type in the 'Issues' section of the repo (this will be added to the tool).

Finally you need to install the Integration into the repo. Do this by going to your 'Settings' page, selecting 'Installed Integrations', selecting your Integration and then selecting the repos you want it installed in in the 'Repository access' section.

### Tailoring ProcBots for a Repo via Configuration File

ProcBots now also respond to a configuration file. This is a file with the name `.procbots.yml` in a relative location for the ProcBot running. In the case of ProcBots operating on a Github repository (such as VersionBot), this is in the root of the repository that it is working on, on the `master` branch.

The configuration file uses a set of nested properties based on the class hierarchy of the ProcBots, with each class able to modify variables at run time from the configuration file.

ProcBots itself has a single property, `minimum_version`, which is checked to ensure that operations only get carried out should that version be satisfied. Should it not find itself to be of at least the minimum version, an error is thrown.

Example:

```
procbot:
    minimum_version: 0.5
```

Other bots are free to add any properties they require. It should be noted that all derived bots are able to view the entire configuration file on request.

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

Example:

```
procbot:
    minimum_version: 0.5
    versionbot:
        maintainers:
            - lekkas
            - hedss
```

**Some Notes:**
* There is currently an issue with the Github API where private repositories do not correctly return PR reviews. Therefore there is no safety check for this although the code is present but disabled in `VersionBot`.
* Should `VersionBot` come across a situation where it does not know how to proceed, it will comment on the PR as such. This can include instances where the `procbot/versionbot/ready-to-merge` label has been added without checks completing. In this case, await the checks to be successful and then reapply the label.

## TBD

* TypeScript review and style.
* Addition of logging and alerting.