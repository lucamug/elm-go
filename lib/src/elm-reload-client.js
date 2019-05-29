(function refresh () {
  var verboseLogging = false
  var socketUrl = window.location.origin

  socketUrl = socketUrl.replace() // This is dynamically populated by the reload.js file before it is sent to the browser
  var socket

  if (verboseLogging) {
    console.log('Reload Script Loaded')
  }

  if (!('WebSocket' in window)) {
    throw new Error('Reload only works with browsers that support WebSockets')
  }

  // Explanation of the flags below:

  // The first change flag is used to tell reload to wait until the socket closes at least once before we allow the page to open on a socket open event. Otherwise reload will go into a inifite loop, as the page will have a socket on open event once it loads for the first time
  var firstChangeFlag = false

  // The navigatedAwayFromPageFlag is set to true in the event handler onbeforeunload because we want to short-circuit reload to prevent it from causing the page to reload before the navigation occurs.
  var navigatedAwayFromPageFlag

  // Wait until the page loads for the first time and then call the webSocketWaiter function so that we can connect the socket for the first time
  window.addEventListener('load', function () {
    if (verboseLogging === true) {
      console.log('Page Loaded - Calling webSocketWaiter')
    }
    websocketWaiter()
  })

  // If the user navigates away from the page, we want to short-circuit reload to prevent it from causing the page to reload before the navigation occurs.
  window.addEventListener('beforeunload', function () {
    if (verboseLogging === true) {
      console.log('Navigated away from the current URL')
    }

    navigatedAwayFromPageFlag = true
  })

  var sanitizeHTML = function (str, type) {
    if (type === 'console') {
      return str
    } else {
      var temp = document.createElement('div')
      temp.textContent = str
      return temp.innerHTML
    }
  }

  var colorConverter = function (color, type) {
    if (color === 'green') {
      if (type === 'console') {
        return 'green'
      } else {
        return 'lightgreen'
      }
    } else if (color === 'cyan') {
      if (type === 'console') {
        return 'blue'
      } else {
        return 'cyan'
      }
    } else if (color === 'yellow') {
      return 'orange'
    } else {
      return color
    }
  }

  function restoreColor (parsedError, type) {
    // This function is similar to "restoreColor" in elm-live.js
    // They should be kept in sync, manually
    var styles = []
    var styleNormal = 'color:#333'
    var coloredError = parsedError.errors.map(function (err) {
      return err.problems.map(function (pro) {
        var headerContent = pro.title.replace('-', ' ') + ' --------------- ' + err.path // + " at " + pro.region.start.line + ":" + pro.region.start.column
        var color = 'color:' + colorConverter('cyan', type)
        var header = ''
        if (type === 'console') {
          styles.push(color, styleNormal)
          header = '%c-- ' + headerContent + '%c\n\n'
        } else {
          header = "<span style='" + color + "'>-- " + headerContent + '</span>\n\n'
        }
        return [header].concat(pro.message.map(function (mes) {
          if (typeof mes === 'string') {
            return sanitizeHTML(mes, type)
          } else {
            var color
            if (mes.underline) {
              color = 'color:' + colorConverter('green', type)
            } else if (mes.color) {
              color = 'color:' + colorConverter(mes.color, type)
            }
            if (type === 'console') {
              styles.push(color, styleNormal)
              return '%c' + sanitizeHTML(mes.string, type) + '%c'
            } else {
              return "<span style='" + color + "'>" + sanitizeHTML(mes.string, type) + '</span>'
            }
          }
        })).join('')
      }).join('\n\n\n')
    }).join('\n\n\n\n\n')

    if (type === 'console') {
      return [coloredError].concat(styles)
    } else {
      return coloredError
    }
  }

  var speed = 400
  var delay = 20

  function showError (error) {
    var parsedError = JSON.parse(error)
    var coloredError = restoreColor(parsedError)
    console.log.apply(this, restoreColor(parsedError, 'console'))
    hideCompiling('fast')
    setTimeout(function () {
      showError_(coloredError)
    }, delay)
  }

  function showError_ (error) {
    var nodeContainer = document.getElementById('elm-live:elmErrorContainer')
    if (!nodeContainer) {
      nodeContainer = document.createElement('div')
      nodeContainer.id = 'elm-live:elmErrorContainer'
      document.body.appendChild(nodeContainer)
    }
    nodeContainer.innerHTML =
                "<div id='elm-live:elmErrorBackground' style='z-index: 100; perspective: 500px; transition: opacity 0.3s; opacity: 0; position: fixed; top: 0; left: 0; background-color: rgba(0,0,0,0.3); width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;'>" +
                "<pre id='elm-live:elmError' style='transform: rotateX(-90deg); transition: transform " +
                speed +
                "ms; transform-style: preserve-3d; font-size: 16px; overflow: scroll; background-color: rgba(0,0,0,0.9); color: #ddd; width: 70%; height: 60%; padding: 30px'>" +
                error +
                '</pre>' +
                '</div>'
    setTimeout(function () {
      document.getElementById('elm-live:elmErrorBackground').style.opacity = 1
      document.getElementById('elm-live:elmError').style.transform = 'rotateX(0deg)'
    }, delay)
  }

  function hideError (speed) {
    var node = document.getElementById('elm-live:elmErrorContainer')
    if (node) {
      if (speed === 'fast') {
        document.getElementById('elm-live:elmErrorContainer').remove()
      } else {
        document.getElementById('elm-live:elmErrorBackground').style.opacity = 0
        document.getElementById('elm-live:elmError').style.transform = 'rotateX(-90deg)'
        setTimeout(function () {
          document.getElementById('elm-live:elmErrorContainer').remove()
        }, speed)
      }
    }
  }

  function showCompiling (message) {
    hideError('fast')
    setTimeout(function () {
      showCompiling_(message)
    }, delay)
  }

  function showCompiling_ (message) {
    var nodeContainer = document.getElementById('elm-live:elmCompilingContainer')
    if (!nodeContainer) {
      nodeContainer = document.createElement('div')
      nodeContainer.id = 'elm-live:elmCompilingContainer'
      document.body.appendChild(nodeContainer)
    }
    nodeContainer.innerHTML =
            '<style>' +
            '#loading {' +
            '  display: inline-block;' +
            '  width: 50px;' +
            '  height: 50px;' +
            '  border: 3px solid rgba(255,255,255,.3);' +
            '  border-radius: 50%;' +
            '  border-top-color: #fff;' +
            '  animation: spin 1s linear infinite;' +
            '}' +
            '@keyframes spin {' +
            'to { transform: rotate(360deg); }' +
            '}' +
            '</style>' +
            "<div id='elm-live:elmCompilingBackground' style='z-index: 100; transition: opacity " +
            speed +
            "ms; opacity: 0; position: fixed; top: 0; left: 0; background-color: rgba(0,0,0,0.3); width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; flex-direction: column'>" +
            "<div id='loading'>" +
            '</div>' +
            "<div style='text-align: center; color: #fff; padding: 30px; font-size: 24px; font-weight: bold; font-family: sans-serif'>" +
            message +
            '</div>' +
            '</div>'
    setTimeout(function () {
      document.getElementById('elm-live:elmCompilingBackground').style.opacity = 1
    }, delay)
  }

  function hideCompiling (speed) {
    var node = document.getElementById('elm-live:elmCompilingContainer')
    if (node) {
      if (speed === 'fast') {
        document.getElementById('elm-live:elmCompilingContainer').remove()
      } else {
        document.getElementById('elm-live:elmCompilingBackground').style.opacity = 0
        setTimeout(function () {
          document.getElementById('elm-live:elmCompilingContainer').remove()
        }, speed)
      }
    }
  }

  // Check to see if the server sent us reload (meaning a manually reload event was fired) and then reloads the page
  var socketOnMessage = function (msg) {
    if (msg.data.match(/^error::/)) {
      // Displaying the Elm compiler error in the console
      // and in the browsers
      showError(msg.data.replace(/^error::/, ''))
    } else if (msg.data === 'reload') {
      hideCompiling()
      window.location.reload()
    } else if (msg.data.match(/^compiling::/)) {
      showCompiling(msg.data.replace(/^compiling::/, ''))
    }
  }

  var socketOnOpen = function (msg) {
    if (verboseLogging) {
      console.log('Socket Opened')
    }

    // We only allow the reload on two conditions, one when the socket closed (firstChange === true) and two if we didn't navigate to a new page (navigatedAwayFromPageFlag === false)
    if (firstChangeFlag === true && navigatedAwayFromPageFlag !== true) {
      if (verboseLogging) {
        // console.log('Reloaded')
      }

      // Reset the firstChangeFlag to false so that when the socket on open events are being fired it won't keep reloading the page
      firstChangeFlag = false

      // Now that everything is set up properly we reload the page
      // window.location.reload()
    }
  }

  // Socket on close event that sets flags and calls the webSocketWaiter function
  var socketOnClose = function (msg) {
    if (verboseLogging) {
      console.log('Socket Closed - Calling webSocketWaiter')
    }

    // We encountered a change so we set firstChangeFlag to true so that as soon as the server comes back up and the socket opens we can allow the reload
    firstChangeFlag = true

    // Call the webSocketWaiter function so that we can open a new socket and set the event handlers
    websocketWaiter()
  }

  var socketOnError = function (msg) {
    if (verboseLogging) {
      console.log(msg)
    }
  }

  // Function that opens a new socket and sets the event handlers for the socket
  function websocketWaiter () {
    if (verboseLogging) {
      console.log('Waiting for socket')
    }
    setTimeout(function () {
      socket = new WebSocket(socketUrl); // eslint-disable-line

      socket.onopen = socketOnOpen
      socket.onclose = socketOnClose
      socket.onmessage = socketOnMessage
      socket.onerror = socketOnError
    }, 250)
  }
})()
