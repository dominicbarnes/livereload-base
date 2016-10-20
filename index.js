
'use strict'

const Server = require('./lib/websocket')

exports.Server = Server

exports.createServer = function () {
  return new Server()
}
