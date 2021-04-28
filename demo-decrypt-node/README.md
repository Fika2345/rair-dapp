# `decrypt-node`

> TODO: description

## Usage

```
const decryptNode = require('decrypt-node');

// TODO: DEMONSTRATE API
```

# `Docker Implementation -in progress

This will build the rair node, but IPFS will not be functioning locally, as additional configuration is necesary to communicate outside of the container.  This is currently observing an external IPFS cluster, as noted in the .env file.

docker build -t rairnode .

docker run -it --rm -p 5000:5000 -p 3000:3000 -p 5001:5001 -p 4001:4001 -p 8080:8080 rairnode

Optionally, use -d flag to run as a daemon

# API

* [x] /api
    * [x] /auth
        * [x] /get_challenge/:MetaAddress - GET - request an auth challenge for the given ethereum address, [see details here](readme/get_challenge.md)
        * [x] /get_token/:MetaMessage/:MetaSignature/:mediaId - GET - respond to a challenge to receive a JWT, [see details here](readme/get_token.md)
        * [x] /admin/:MetaMessage/:MetaSignature - GET - verify with a Metamask challenge if the user holds the current Administrator token, [see details here](readme/admin.md)
        * [x] /new_admin/:MetaMessage/:MetaSignature - POST - verify the user holds the current Admin token and then replace it with a new token, [see details here](readme/new_admin.md)
    * [x] /media
        * [x] /add/:mediaId - POST - register a new piece of media, [see details here](readme/add_media.md)
        * [x] /remove/:mediaId - DELETE - find and delete the media, [see details here](readme/remove_media.md)
        * [x] /list - GET - list all the registered media, their URIs and encrypted status, [see details here](readme/get_all_media.md)
        * [x] /upload - POST - upload the media, [see details here](readme/upload_media.md)
    * [x] /docs - swagger documentation for the server
* [x] /stream/:token/:mediaId - POST - Register a new piece of media, [see details here](readme/stream.md)