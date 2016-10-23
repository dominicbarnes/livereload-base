/* eslint-env mocha */

'use strict'

const assert = require('chai').assert
const fs = require('fs')
const livereload = require('..')
const request = require('supertest')
const Server = require('../lib/websocket')
const WebSocket = require('ws')

const host = 'localhost:35729'
const js = fs.readFileSync(require.resolve('livereload-js/dist/livereload.js'))

describe('livereload-base', function () {
  describe('.Server', function () {
    it('should export the Server instance directly', function () {
      assert.strictEqual(livereload.Server, Server)
    })
  })

  describe('.createServer()', function () {
    const server = livereload.createServer()

    before(function (done) {
      server.listen(done)
    })

    afterEach(function (done) {
      for (const client of server.wss.clients) client.terminate()
      setTimeout(done, 100)
    })

    after(function (done) {
      server.close(done)
    })

    it('should return a Server instance', function () {
      assert.instanceOf(server, Server)
    })

    context('http', function () {
      const base = `http://${host}`

      it('should serve the livereload client javascript', function (done) {
        request(base)
          .get('/livereload.js')
          .expect('Content-Type', 'text/javascript')
          .expect(200, js.toString(), done)
      })

      it('should serve a 404 for other routes', function (done) {
        request(base)
          .get('/')
          .expect(404, done)
      })

      it('should serve a 404 for favicon', function (done) {
        request(base)
          .get('/favicon.ico')
          .expect(404, done)
      })
    })

    context('websocket', function () {
      const base = `ws://${host}/livereload`

      it('should start a websocket server', function (done) {
        const ws = new WebSocket(base)
        ws.on('close', () => done())
        ws.on('error', (err) => done(err))
        ws.on('open', () => ws.close())
      })

      context('on client hello', function () {
        it('should respond with another hello', function (done) {
          const ws = new WebSocket(base)
          ws.on('close', () => done())
          ws.on('error', (err) => done(err))
          ws.on('open', () => ws.send(JSON.stringify({ command: 'hello' })))
          ws.on('message', (payload) => {
            const message = JSON.parse(payload)
            assert.equal(message.command, 'hello')
            assert.equal(message.serverName, 'livereload-base')
            assert.isArray(message.protocols)
            ws.close()
          })
        })
      })

      context('on client *', function () {
        it('should be a no-op', function (done) {
          const ws = new WebSocket(base)
          ws.on('close', () => done())
          ws.on('error', (err) => done(err))
          ws.on('message', (message) => done(new Error('no response expected')))
          ws.on('open', () => {
            const payload = JSON.stringify({ command: 'something' })
            ws.send(payload, function () {
              // delay long enough to see if server responds
              setTimeout(() => ws.close(), 100)
            })
          })
        })
      })

      context('on server reload', function () {
        it('should send a reload command', function (done) {
          const ws = new WebSocket(base)
          ws.on('close', () => done())
          ws.on('error', (err) => done(err))
          ws.on('message', (payload) => {
            const message = JSON.parse(payload)
            assert.equal(message.command, 'reload')
            assert.equal(message.path, 'index.js')
            assert.isTrue(message.liveCSS)
            ws.close()
          })

          ws.on('open', () => server.reload('index.js'))
        })

        it('should broadcast to all clients', function (done) {
          let opened = 0
          let reloaded = 0
          let closed = 0

          const ws1 = new WebSocket(base)
          ws1.on('open', open)
          ws1.on('error', (err) => done(err))
          ws1.on('message', message)
          ws1.on('close', close)

          const ws2 = new WebSocket(base)
          ws2.on('open', open)
          ws2.on('error', (err) => done(err))
          ws2.on('message', message)
          ws2.on('close', close)

          function open () {
            if (++opened < 2) return
            server.reload('index.css')
            setTimeout(() => {
              ws1.close()
              ws2.close()
            }, 100)
          }

          function message () {
            reloaded++
          }

          function close () {
            if (++closed < 2) return
            assert.strictEqual(reloaded, 2)
            done()
          }
        })
      })

      context('on server alert', function () {
        it('should send an alert command', function (done) {
          const ws = new WebSocket(base)
          ws.on('close', () => done())
          ws.on('error', (err) => done(err))
          ws.on('message', (payload) => {
            const message = JSON.parse(payload)
            assert.equal(message.command, 'alert')
            assert.equal(message.message, 'hello world')
            ws.close()
          })

          ws.on('open', () => server.alert('hello world'))
        })

        it('should broadcast to all clients', function (done) {
          let opened = 0
          let reloaded = 0
          let closed = 0

          const ws1 = new WebSocket(base)
          ws1.on('open', open)
          ws1.on('error', (err) => done(err))
          ws1.on('message', message)
          ws1.on('close', close)

          const ws2 = new WebSocket(base)
          ws2.on('open', open)
          ws2.on('error', (err) => done(err))
          ws2.on('message', message)
          ws2.on('close', close)

          function open () {
            if (++opened < 2) return
            server.alert('hello world')
            setTimeout(() => {
              ws1.close()
              ws2.close()
            }, 100)
          }

          function message () {
            reloaded++
          }

          function close () {
            if (++closed < 2) return
            assert.strictEqual(reloaded, 2)
            done()
          }
        })
      })
    })
  })
})
