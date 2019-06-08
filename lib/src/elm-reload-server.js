module.exports = function elmServe (opts) {
  const http = require('http')
  const https = require('https')
  const elmReload = require('./elm-reload')
  const fs = require('fs')
  const opn = require('opn')
  const clc = require('cli-color')
  const internalIp = require('internal-ip')
  const serveStatic = require('serve-static')
  const finalhandler = require('finalhandler')
  const URL = require('url-parse')

  const port = opts[0]
  const dir = opts[1]
  const openBrowser = opts[2]
  const hostname = opts[3]
  const runFile = opts[4]
  const startPage = opts[5]
  const pushstate = opts[6]
  const verbose = opts[7]
  const proxyPrefix = opts[8]
  const proxyHost = opts[9]
  const ssl = opts[10]
  const ip = internalIp.v4.sync()
  const reloadOpts = {
    port: port,
    verbose: verbose
  }

  let reloadReturned

  const serve = serveStatic(dir, { index: ['index.html', 'index.htm'] })

  const proxy = (typeof proxyPrefix === 'string' && typeof proxyHost === 'string')
    ? require('http-proxy').createProxyServer()
    : false

  function handler (req, res) {
    const url = new URL(req.url)

    if (proxy && url.pathname.startsWith(proxyPrefix)) {
      proxy.web(req, res, { target: proxyHost })
      return
    }

    const pathname = url.pathname.replace(/(\/)(.*)/, '$2') // Strip leading `/` so we can find files on file system
    const fileEnding = pathname.split('.')[1]

    if (
      (pushstate && fileEnding === undefined) ||
        fileEnding === 'html' ||
        pathname === '/' ||
        pathname === ''
    ) {
      const finalpath =
          pathname === '/' || pathname === ''
            ? dir + '/' + startPage
            : dir + '/' + pathname

      fs.readFile(finalpath, 'utf8', function (err, contents) {
        var scriptInjecton = `\n\n    <!-- Inserted by elm-live (START) -->\n    <script src="/reload/reload.js"></script>\n    <!-- Inserted by elm-live (END) -->\n`
        if (err) {
          const rootpath = dir + '/' + startPage
          fs.readFile(rootpath, 'utf8', function (err, contents) {
            if (err) {
              res.writeHead(404, { 'Content-Type': 'text/plain' })
              res.end('File Not Found')
            } else {
              res.setHeader('Content-Type', 'text/html')
              res.end(contents.replace(/(<head[^>]*>)/, `$1${scriptInjecton}`))
            }
          })
        } else {
          res.setHeader('Content-Type', 'text/html')
          res.end(contents.replace(/(<head[^>]*>)/, `$1${scriptInjecton}`))
        }
      })
    } else if (pathname === 'reload/reload.js') {
      // Server reload-client.js file from injected script tag
      res.setHeader('Content-Type', 'text/javascript')
      res.end(reloadReturned.reloadClientCode())
    } else {
      // Serve any other file using serve-static
      serve(req, res, finalhandler(req, res))
    }
  }

  function listener () {
    if (!fs.existsSync(runFile)) {
      fs.writeFileSync(runFile)

      // If openBrowser, open the browser with the given start page above, at a hostname (localhost default or specified).
      if (openBrowser) {
        const protocol = ssl ? 'https://' : 'http://'
        opn(protocol + hostname + ':' + port)
      }
      const time = new Date()
      console.log(
        clc.green('Server started at ' + time.toTimeString().slice(0, 8))
      )
    } else {
      const time = new Date()
      console.log(
        clc.green('Server restarted at ' + time.toTimeString().slice(0, 8))
      )
    }
  }

  function startServer (serverStartedCallback) {
    serverStartedCallback = serverStartedCallback || function () {}
    if (ssl) {
      const pem = require('pem')
      const baseNames = [ 'localhost', '127.0.0.1' ]
      const altNames = (ip && baseNames.indexOf(ip) === -1)
        ? [ip, ...baseNames]
        : baseNames

      pem.createCertificate({
        days: 1,
        selfSigned: true,
        commonName: ip,
        altNames
      }, function (err, { serviceKey, certificate }) {
        if (err) throw new Error(err)
        const server = https.createServer({ key: serviceKey, cert: certificate }, handler)
        reloadReturned = elmReload(reloadOpts, server)
        server.listen(port, listener)
        serverStartedCallback({
          sendMessage: reloadReturned.sendMessage
        })
      })
    } else {
      const server = http.createServer(handler)
      reloadReturned = elmReload(reloadOpts, server)
      server.listen(port, listener)
      serverStartedCallback({
        sendMessage: reloadReturned.sendMessage
      })
    }
  }

  return {
    startServer: startServer
  }
}
