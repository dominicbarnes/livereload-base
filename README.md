# livereload-base

This is a [LiveReload][livereload] server implementation that exposes an API for
communicating with LiveReload-compatible clients. The watcher implementation is
intentionally excluded to allow developers to bring their own without needing to
worry about implementing the LiveReload-compatible server.

## Example

```js
const livereload = require('livereload-base')

// create and start the server
const server = livereload.createServer()
server.listen(() => console.log('livereload server listening'))

// bring your own watcher...
watcher.on('change', (file) => server.reload(file.path))
```

## API

This is a very new module, so I expect the API to change fairly frequently as
real-world usage occurs.

### createServer()

Creates a new `Server` instance. There is no configuration available at the
time, but that may likely change in the future.

### Server()

This base class represents a [LiveReload][livereload]-compatible server, which
includes both HTTP and Websockets as described in the LiveReload
[protocol specification][livereload-protocol]

### Server#listen(callback)

Starts the server, which will listen on port `35729`, as defined by the
[spec][livereload-protocol].

The `callback` is optional, and will be invoked for the `listening` event, which
indicates that the server is ready to accept connections.

### Server#reload(file)

Broadcasts a `reload` command to all the connected clients.

The `file` parameter tells the client which file was changed. An absolute path
is preferred, but a simple basename will suffice.

### Server#alert(message)

Broadcasts an `alert` command to all connected clients.

The `message` parameter will be sent to the clients, which may be communicated
to the end-user.


[livereload]: http://livereload.com/
[livereload-protocol]: http://feedback.livereload.com/knowledgebase/articles/86174-livereload-protocol
