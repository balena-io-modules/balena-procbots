# SyncBot

A little Bot, using the ProcBot framework, that links communication services

## Main Configuration

* Threads
  * New topics in troubleshooting on forums.resin.io become new threads in r/support on flowdock
  * New threads in r/support on flowdock go nowhere
* Comments
  * Public comments in linked threads get synchronised
    * Use a `%` or `💬` at the beginning of the message to indicate it is public
  * Private comments remain private, but are synchronised
    * Uses discourse's `whisper`
    * Without syntax, private is assumed
  * Comments in unlinked threads are not synchronised
    * Such as threads that began in flowdock

## Your Configuration

* Get your discourse details
  * Try:
    * Sign-in to forums.resin.io
    * Go to your preferences page (top right profile picture > cog icon)
    * Go to your admin page (top right spanner labelled admin)
    * Under permissions generate an API key
  * Catch:
    * Become a Discourse Admin
    * Log out and in
* Give your discourse details to SyncBot
  * Send the following PM's to the SyncBot account:
    * `My discourse user is ...`
    * `My discourse token is ...`
  * Do not be surprised by the lack of response
    * Syncbot searches when required rather than constantly listening
    * Testing and confirming receipt will be developed
* Test your link
  * [test thread](https://www.flowdock.com/app/rulemotion/user_happiness/threads/XY9ykgPS8EFABsLL57aCXMRxf44) this is an unlisted thread which can be used to test your Discourse details with SyncBot. SyncBot will complain if there is an error, otherwise stay silent.
