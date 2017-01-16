# procbots

Process bots used for automating the development and deployment CI pipeline.

**WARNING:** This is extreme WIP. It might utterly destroy any repositories hooked up to it.

## Installation

`npm install` in root repo. You'll need to install modules before opening Visual Code (if using it) else it won't find the TypeScript defs it needs, and will moan at you.

## Building

`gulp build` or run Visual Code and build as per normal. There is an extra task for VC which will build the code before debugging.

## Secret Key, Webhook Token and Integration ID

You'll need the right private key to run the Integration. It is not supplied here.

You'll need to fill in the `WEBHOOK_SECRET` and `INTEGRATION_ID` fields in `.vscode/launch.json` before debugging (if you're running this on the CLI, set envvars accordingly).

Ask Heds how this works.

## Running

Currently there is only one version bot.

`./bin/procbot -b versionbot`

This allows the checking of commits for a PR and merging them when the right labels/conditions are met.

Currently versioning is broken, and needs re-writing using the Github API.

## Github Hook Port

It listens on port 4567 of the host machine, and expects hooks sent to the `/webhooks` path.
