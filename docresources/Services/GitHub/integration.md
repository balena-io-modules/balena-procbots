## Creating a Github Integration

ProcBots can run with an Integration in the Github scope. For development, you can create an Integration on your personal Github account by going to your Settings page (from your profile avatar icon) and selecting 'Github Apps -> Register New Github App` from the 'Developer Settings' sidebar.

    * Give Integration a name
    * Set a Homepage URL (required but not used)
    * Set a Webhook URL (this is where all webhooks will go to, eg: `http://myurl.com:4567/webhooks`), details should be in the particular ProcBot setup.
    * Create a new Webhook Secret (see [here](https://developer.github.com/webhooks/securing/)). You will require this secret later

    * Set up secure Webhooks:
        - Go to repository you want Integration on
        - Add a new secret
        - Add relevant code for HMAC digest in version bot and check again 'x-hub-signature' header entry for matching digest

Set 'Permissions' and 'Subscribe to events' in 'Permissions & webhooks', details should be in the particular ProcBot setup.

Now hit 'Save'. The Integration will be created and you'll be given an Integration ID (note it down, it will be required later).

Finally you need to create a new private key for your Integration. Hit the 'Generate Private Key' in the 'Private Key' section.

Download the key and then create a Base64 string from it. It will be required later.
