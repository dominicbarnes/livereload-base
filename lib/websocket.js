
'use strict'

const http = require('./http')
const pkg = require('../package.json')
const ws = require('ws')

const port = 35729
const protocols = [
  'http://livereload.com/protocols/connection-check-1',
  'http://livereload.com/protocols/official-7'
]
const serverName = pkg.name

class Server {
  constructor () {
    const wss = new ws.Server({
      server: http(),
      path: '/livereload'
    })

    wss.on('connection', client => this.connect(client))
    this.wss = wss
  }

  connect (client) {
    client.on('message', message => this.handle(client, JSON.parse(message)))
  }

  handle (client, message) {
    if (message.command !== 'hello') return
    this.command(client, 'hello', { protocols })
    // TODO: handle url command?
    // @see http://feedback.livereload.com/knowledgebase/articles/86174-livereload-protocol
  }

  command (client, key, params) {
    const payload = Object.assign({
      command: key,
      serverName: serverName
    }, params)

    client.send(JSON.stringify(payload))
  }

  broadcast (key, params) {
    for (const client of this.wss.clients) {
      this.command(client, key, params)
    }
  }

  reload (file) {
    this.broadcast('reload', {
      path: file,
      liveCSS: true // TODO: make configurable
    })
  }

  alert (message) {
    this.broadcast('alert', { message })
  }

  listen (callback) {
    return this.wss._server.listen(port, callback)
  }
}

module.exports = Server
