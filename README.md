# procbots

Process bots used for automating the development and deployment CI pipeline.

**WARNING:** This is extreme WIP. It might utterly destroy any repositories hooked up to it.

## Installation

`npm install` in root repo.

## Building

`gulp build` or run Visual Code and build as per normal. There is an extra task for VC which will build the code before debugging.

## Running

Currently there is only one version bot.

`./bin/procbot -b versionbot`

## Github Hook Port

It listens on port 4567 of the host machine, and expects hooks sent to the `/webhooks` path.
