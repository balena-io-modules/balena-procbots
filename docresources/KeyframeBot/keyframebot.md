# KeyframeBot

KeyframeBot is a CI tool designed to help engineers with verifying the validity of a new Keyframe for deployment, as well as enabling valid Keyframes to be deployed to a specified environment.

## Using KeyframeBot

### Updating a Product Keyframe

Engineers can update a Product Keyframe by creating a local branch, making relevant changes to the components to update in the `keyframe.yml` file, and then creating a PR for that branch (following the usual Commit/PR guidelines).

KeyframeBot will then lint the altered file to ensure that it validates correctly. Should it fail, a failed status check will occur and the Keyframe file will need to be modified so that it passes linting.

Once linting is successful, a review will be required to ensure that it should be committed to the `master` branch. Reviews and version bumping occur as per normal workflow.

### Deploying a Keyframe to an Environment

Once a PRd Keyframe has been version bumped and merged to the `master` branch, request of a deployment to a particular environment is achieved via a `POST` to KeyframeBot by sending a JSON body specifying the version of the Keyframe to deploy and the environment to deploy the component to:

    curl -XPOST http://localhost:7789/deploykeyframe -H 'Authorization: token <token>' \
    -H 'Content-Type: application/json' -d '{"version": "v0.0.1", "environment": "myEnv"}'

## Installing KeyframeBot

### Secret Key, Webhook Token and Integration ID

`KeyframeBot` requires the following environment variables:

* `KEYFRAMEBOT_WEBHOOK_SECRET`: The 20 digit hex key used to authenticate messages
* `KEYFRAMEBOT_INTEGRATION_ID`: The ID given on Integration creation, a unique identifier
* `KEYFRAMEBOT_PEM`: The Base64 encoded private key generated on Integration creation
* `KEYFRAMEBOT_NAME`: The name shown in commits and merges for PRs by the Integration
* `KEYFRAMEBOT_PRODUCT_REPO`: The repository where Keyframe updates take place, in `owner/reponame` format
* `KEYFRAMEBOT_ENVIRONMENTS`: A JSON object denoting the names of environments and their repository addresses, in the format `{ "<environment>": "<owner/reponame>", ... }`

### Initialising a Repo

Before the KeyframeBot ProcBot can deal with a repository, both the product repo and environment repos themselves needs to be updated to support it.

Go to the `Settings` page for the repo, select `Branches` and then `Protected branches`, choose the `master` branch and then turn on at least the following:

    [x] Protect this branch
        [x] Require pull request reviews before merging
    [x] Require status checks to pass before merging
        [x] Require branches to be up to date before merging
        Status checks:
        [x] KeyframeBot

The `KeyframeBot` status check won't be visible until VersionBot has operated on the repo for the first time. Come back after the rest of these steps.

**Note:** This must be carried out by an admin user of the repo.

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
