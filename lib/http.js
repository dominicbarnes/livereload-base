
'use strict'

const fs = require('fs')
const http = require('http')
const url = require('url')

const js = fs.readFileSync(require.resolve('livereload-js/dist/livereload.js'))

module.exports = function () {
  return http.createServer(handler)
}

function handler (req, res) {
  if (isJS(req)) {
    res.writeHead(200, { 'Content-Type': 'text/javascript' })
    res.write(js)
  } else {
    res.writeHead(404, http.STATUS_CODES[404])
  }
  res.end()
}

function isJS (req) {
  const method = req.method.toUpperCase()
  const path = url.parse(req.url).pathname
  return method === 'GET' && path === '/livereload.js'
}
