# procbots

Process bots used for automating the development and deployment CI pipeline.

Currently only the `VersionBot` exists. `VersionBot` will:

* Look for new PRs and check that there is at least one commit in the PR which features a suitable `Change-Type:` tag
* Look for PR review approval ***and*** a label applied to the PR to mark it ready for merge (`flow/ready-for-merge`)
* On seeing appropriate label and review, will automatically:
    1. Clone the PR branch for the repo
    2. Run `versionist` upon it
    3. Should a new version be generated, commit any appropriate files (eg. `CHANGELOG.md`, `package.json`) to the branch
    4. Merge the branch back into the head

Merges and checks can be suppressed using the `flow/no-version-checks` label on a PR.

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
		- Commit statues:
			# Status: R/W
		- Issues:
			# Issue comment: R/W  - Probably only need R/O
			# Issues: R/W - Probably only need R/O
		- Pull Requests:
			# Pull request: R/W - Probably only need R/O
			# Pull request review: R/W - Probably only need R/O
			# Pull request review comment: R/W - Probably only need R/O
		- Repository contents:
            # Commit comment - R/W
            # Create - R/W
			# Delete - R/W
            # Fork - R/W
			# Push - R/W
			# Release - R/W

Now hit 'Save'. The Integration will be created and you'll be given an Integration ID (note it down, it will be required later).

Finally you need to create a new private key for your Integration. Hit the 'Generate Private Key' in the 'Private Key' section.

Download the key and then create a Base64 string from it. It will be required later.

## Secret Key, Webhook Token and Integration ID

You'll need the right private key to run the Integration. It is not supplied here. `ProcBot` requires the following environment variables:

    `WEBHOOK_SECRET`: The 20 digit hex key used to authenticate messages.
    `INTEGRATION_ID`: The ID given on Integration creation, a unique identifier.
    `PROCBOTS_PEM`: The Base64 encoded private key generated on Integration creation.
	`FLOWDOCK_ALERTS`: If present and set to 'true', alerts will be sent to any relevant Flowdock room.

`VersionBot` requires the following environment variables:

	`VERSIONBOT_NAME`: The name shown in commits and merges for PRs by the Integration.
	`VERSIONBOT_EMAIL`: Email address for the bot, (can be an empty string).
	`VERSIONBOT_FLOWDOCK_ROOM`: The room ID whose inbox will be posted to. If `FLOWDOCK_ALERTS` is set to `true` this **must** be present.


You'll need to fill these fields out in `.vscode/launch.json` before debugging (if you're running this on the CLI, set envvars accordingly). If you're running on Resin, these must be set as Application envvars.

Ask Heds how this works if unsure.

## Initialising a Repo

Before the Versionist ProcBot can deal with a repository, the repo itself needs to be updated to support it.

Use the tool in `tools/initRepo` to setup the repository in such a way that the `master` branch is guarded and merges can only occur post-review and with a `procbot/versionbot/ready-to-merge` label:

    ./tools/initRepo/bin/initRepo -u bob -p bobspassword -r bob/bobsrepo

**Note:** This must be carried out by an admin user of the repo, in this case `bob`.

Ensure you also create the `procbot/versionbot/ready-to-merge` label type in the 'Issues' section of the repo (this will be added to the tool).

Finally you need to install the Integration into the repo. Do this by going to your 'Settings' page, selecting 'Installed Integrations', selecting your Integration and then selecting the repos you want it installed in in the 'Repository access' section.

## Running

Currently there is only one ProcBot, VersionBot. You can run this from within Visual Code by building and then debugging in the usual way, or you can run it from the command line:

`./bin/procbot -b versionbot`

This allows the checking of commits for a PR and merging them when the right labels/conditions are met.

`VersionBot` will ignore any status checks and not attempt to merge should the `procbots/versionbot/no-checks` label be present on any PR it would otherwise operate on.

## TBD

* TypeScript review and style.
* Addition of logging and alerting.