# SyncBot

A little Bot, using the ProcBot framework, that links communication services

## Main Configuration

* Threads
  * Public threads in linked rooms get synchronised
    * Use a `%` or `💬` at the beginning of a line to indicate the topic is public
  * Private thread remain private, but are synchronised
    * Uses discourse's `unlisted`
    * Without syntax, private is assumed
* Comments
  * Public comments in linked threads get synchronised
    * Use a `%` or `💬` at the beginning of a line to indicate the comment is public
  * Private comments remain private, but are synchronised
    * Uses discourse's `whisper`
    * Uses front's `comment`
    * Without syntax, private is assumed

## Your Configuration

* Ensure your Front, Discourse & Flowdock usernames match
* Get your discourse details
  * Try:
    * Sign-in to forums.resin.io
    * Go to your preferences page (top right profile picture > cog icon)
    * Go to your admin page (top right spanner labelled admin)
    * Under permissions generate an API key
  * Catch:
    * Ask a Discourse admin to:
      * Make you a moderator
      * Generate an API key for you
* Give your discourse details to SyncBot
  * Send the following PM's to the SyncBot account:
    * `My discourse token is ...`
  * Do not be surprised by the lack of response
    * Syncbot searches when required rather than constantly listening
    * Testing and confirming receipt will be developed
* Test your link
  * [test thread](https://www.flowdock.com/app/rulemotion/user_happiness/threads/XY9ykgPS8EFABsLL57aCXMRxf44) this is an unlisted thread which can be used to test your Discourse details with SyncBot. SyncBot will complain if there is an error, otherwise stay silent.
