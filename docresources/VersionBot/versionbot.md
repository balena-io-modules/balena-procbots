# VersionBot

VersionBot is a CI tool designed to help engineers with PRs, linting commits, ensuring reviews have been made by appropriate Github users and finally bumping the version of a component when it's merged to the `master` branch. In brief, it will:

* Look for new PRs and check that there is at least one commit in the PR which features a suitable `Change-Type:` tag
* Look for required status checks (such as other CI systems) that fail, and then alert the author of the PR
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

`VersionBot` runs as an Integration in the Github scope. For development, you can create an Integration on your personal Github account by going to your Settings page (from your profile avatar icon) and selecting 'Github Apps -> Register New Github App` from the 'Developer Settings' sidebar.

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

Now hit 'Save'. The Integration will be created and you'll be given an Integration ID (note it down, it will be required later).

Finally you need to create a new private key for your Integration. Hit the 'Generate Private Key' in the 'Private Key' section.

Download the key and then create a Base64 string from it. It will be required later.

## Secret Key, Webhook Token and Integration ID

`VersionBot` requires the following environment variables:

* `VERSIONBOT_WEBHOOK_SECRET`: The 20 digit hex key used to authenticate messages.
* `VERSIONBOT_INTEGRATION_ID`: The ID given on Integration creation, a unique identifier.
* `VERSIONBOT_PEM`: The Base64 encoded private key generated on Integration creation.
* `VERSIONBOT_NAME`: The name shown in commits and merges for PRs by the Integration.
* `VERSIONBOT_EMAIL`: Email address for the bot, (can be an empty string).

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

The `Versionist` status check won't be visible until VersionBot has operated on the repo for the first time. Come back after the rest of these steps.

**Note:** This must be carried out by an admin user of the repo, in this case `bob`.

Ensure you also create the `procbots/versionbot/ready-to-merge` and `procbots/versionbot/no-checks` label types in the 'Issues' section of the repo (this will be added to the tool).

Finally you need to install the Github App into the repo. Do this by going to your 'Settings' page for the Github App (as above), selecting the appropriate App and then selecting the 'Your installations' tab. Hit the cog to the right of the organisation name, and then add the repos you want VersionBot to run on in the `Repository access` section. Remember to hit `Save`.

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
