// The following 20 lines are from https://github.com/klazuka/elm-hot/blob/master/test/client.js#L40
var myDisposeCallback = null

// simulate the HMR api exposed by webpack
var module = {
  hot: {
    accept: function () {},

    dispose: function (callback) {
      myDisposeCallback = callback
    },

    data: null,

    apply: function () {
      var newData = {}
      myDisposeCallback(newData)
      module.hot.data = newData
    },

    // TODO, dynamically update this verbose flag by elm-reload.js so that
    // the entire verbose setting of elm-live is inherited
    verbose: false
  }
};

(function refresh () {
  var verboseLogging = false // This is dynamically update by elm-reload.js file before it is sent to the browser
  var socketUrl = window.location.origin

  socketUrl = socketUrl.replace() // This is dynamically populated by the elm-reload.js file before it is sent to the browser
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
      return str.replace(/<(http[^>]*)>/, '$1')
    } else {
      var temp = document.createElement('div')
      temp.textContent = str
      return temp.innerHTML.replace(/&lt;(http[^>]*)&gt;/, "&lt;<a style='color: inherit' target='_blank' href='$1'>$1</a>&gt;")
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

  function capitalizeFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  function restoreColor (parsedError, cwd, ide, type) {
    // This function is similar to "restoreColor" in elm-live.js
    // They should be kept in sync, manually
    var styles = []
    var styleNormal = 'color:#333'
    var coloredError = parsedError.errors.map(function (err) {
      return err.problems.map(function (pro) {
        var headerContent = pro.title.replace('-', ' ') + ' --------------- ' + err.path
        var color = 'color:' + colorConverter('cyan', type)
        var header = ''
        if (type === 'console') {
          styles.push(color, styleNormal)
          header = '%c-- ' + headerContent + '%c\n\n'
        } else {
          var ideUrl = ide + '://open?url=file://' + cwd + '/' + err.path + '&line=' + pro.region.start.line + '&column=' + pro.region.start.column
          header = "<span style='" + color + "'>" + headerContent + " [<a style='color: inherit' href='" + ideUrl + "'>open in " + capitalizeFirstLetter(ide) + '</a>]</span>\n\n'
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

  function speedAndDelay (noAnimation) {
    if (noAnimation) {
      return {
        speed: 0,
        delay: 0
      }
    } else {
      return {
        speed: 400,
        delay: 20
      }
    }
  }

  function showError (error, cwd, ide, noAnimation) {
    var animation = speedAndDelay(noAnimation)
    var coloredError = restoreColor(error, cwd, ide)
    console.log.apply(this, restoreColor(error, cwd, ide, 'console'))
    hideCompiling(true)
    setTimeout(function () {
      showError_(coloredError, noAnimation)
    }, animation.delay)
  }

  function showError_ (error, noAnimation) {
    var animation = speedAndDelay(noAnimation)
    var nodeContainer = document.getElementById('elm-live:elmErrorContainer')
    if (!nodeContainer) {
      nodeContainer = document.createElement('div')
      nodeContainer.id = 'elm-live:elmErrorContainer'
      document.body.appendChild(nodeContainer)
    }
    nodeContainer.innerHTML =
                "<div id='elm-live:elmErrorBackground' style='z-index: 100; perspective: 500px; opacity: 0; transition: opacity " +
                animation.speed +
                "ms; position: fixed; top: 0; left: 0; background-color: rgba(0,0,0,0.3); width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;'>" +
                "<div onclick='elmLive.hideError()' style='background-color: rgba(0,0,0,0); position: fixed; top:0; left:0; bottom:0; right:0'></div>" +
                "<pre id='elm-live:elmError' style='transform: " +
                (noAnimation ? '' : 'rotateX(-90deg);') +
                'transition: transform ' +
                animation.speed +
                "ms; transform-style: preserve-3d; font-size: 16px; overflow: scroll; background-color: rgba(20, 20, 20, 0.9); color: #ddd; width: 70%; height: 60%; padding: 30px'>" +
                error +
                '</pre>' +
                '</div>'
    setTimeout(function () {
      var el1 = document.getElementById('elm-live:elmErrorBackground')
      var el2 = document.getElementById('elm-live:elmError')
      if (el1) {
        el1.style.opacity = 1
        if (!noAnimation && el2) {
          el2.style.transform = 'rotateX(0deg)'
        }
      }
    }, animation.delay)
  }

  function hideError (noAnimation) {
    var animation = speedAndDelay(noAnimation)
    var node = document.getElementById('elm-live:elmErrorContainer')
    if (node) {
      document.getElementById('elm-live:elmErrorBackground').style.opacity = 0
      document.getElementById('elm-live:elmError').style.transform = 'rotateX(90deg)'
      setTimeout(function () {
        document.getElementById('elm-live:elmErrorContainer').remove()
      }, animation.speed)
    }
  }

  function showCompiling (message, noAnimation) {
    console.log(`%c${message}`, `color:${colorConverter('green', 'console')}`)
    var animation = speedAndDelay(noAnimation)
    hideError(true)
    setTimeout(function () {
      showCompiling_(message, noAnimation)
    }, animation.delay)
  }

  function rotateTangram (figure) {
    el = document.getElementsByClassName('xxx')[0]
    if (el) {
      var nextFigure = 'cat'
      if (figure === 'cat') {
        nextFigure = 'swan'
      } else if (figure === 'swan') {
        nextFigure = 'rabbit'
      } else if (figure === 'rabbit') {
        nextFigure = 'basic'
      }
      el.className = el.className.replace(/xxx--(\S*)/, 'xxx--' + nextFigure)
      setTimeout(function () {
        rotateTangram(nextFigure)
      }, 2000)
    }
  }

  function showCompiling_ (message, noAnimation) {
    var animation = speedAndDelay(noAnimation)
    var nodeContainer = document.getElementById('elm-live:elmCompilingContainer')
    if (!nodeContainer) {
      nodeContainer = document.createElement('div')
      nodeContainer.id = 'elm-live:elmCompilingContainer'
      document.body.appendChild(nodeContainer)
    }
    nodeContainer.innerHTML =

                '<style>' +
                '.xxx--basic .xxx--triangle--pink{transform:translate(102px,44px)rotate(180deg);border-left-color:#F0AD00;}.xxx--basic .xxx--triangle--purple{transform:translate(62px,84px)rotate(270deg);border-left-color:#F0AD00;}.xxx--basic .xxx--triangle--turquoise{transform:translate(97px,99px)rotate(45deg);border-left-color:#60B5CC;}.xxx--basic .xxx--triangle--yellow{transform:translate(23px,45px);border-left-color:#5A6378;}.xxx--basic .xxx--triangle--red{transform:translate(49px,19px)rotate(90deg);border-left-color:#60B5CC;}.xxx--basic .xxx--square--orange{transform:translate(83px,78px)rotate(45deg);background-color:#7FD13B;}.xxx--basic .xxx--parallelogram--green{transform:translate(45px,118px)rotate(-45deg)skew(45deg);background-color:#7FD13B;}.xxx--cat .xxx--triangle--pink{transform:translate(0px,0px);}.xxx--cat .xxx--triangle--purple{transform:translate(26px,0px)rotate(180deg);}.xxx--cat .xxx--triangle--turquoise{transform:translate(5px,66px)rotate(180deg);}.xxx--cat .xxx--triangle--yellow{transform:translate(42px,66px);}.xxx--cat .xxx--triangle--red{transform:translate(50px,122px)rotate(45deg);}.xxx--cat .xxx--square--orange{transform:translate(8px,35px)rotate(45deg);}.xxx--cat .xxx--parallelogram--green{transform:translate(111px,155px)skew(-45deg);}.xxx--swan .xxx--triangle--pink{transform:translate(-3px,77px);}.xxx--swan .xxx--triangle--purple{transform:translate(1px,2px)rotate(45deg);}.xxx--swan .xxx--triangle--turquoise{transform:translate(-1px,94px)rotate(180deg);}.xxx--swan .xxx--triangle--yellow{transform:translate(28px,97px)rotate(135deg);}.xxx--swan .xxx--triangle--red{transform:translate(63px,68px)rotate(90deg);}.xxx--swan .xxx--square--orange{transform:translate(6px,58px)rotate(45deg);}.xxx--swan .xxx--parallelogram--green{transform:translate(21px,19px)rotate(45deg)skew(45deg);}.xxx--rabbit .xxx--triangle--pink{transform:translate(30px,166px)rotate(45deg);}.xxx--rabbit .xxx--triangle--purple{transform:translate(10px,105px)rotate(180deg);}.xxx--rabbit .xxx--triangle--turquoise{transform:translate(49px,153px)rotate(135deg);}.xxx--rabbit .xxx--triangle--yellow{transform:translate(30px,60px)rotate(135deg);}.xxx--rabbit .xxx--triangle--red{transform:translate(65px,98px)rotate(-45deg);}.xxx--rabbit .xxx--square--orange{transform:translate(0px,37px);}.xxx--rabbit .xxx--parallelogram--green{transform:translate(38px,0px)skew(-45deg);}.xxx--triangle,.xxx--square,.xxx--parallelogram{position:absolute;transition:all 2s;}.xxx--triangle{width:0;height:0;}.xxx--triangle--pink{border-left:25px solid #fff;border-top:25px solid transparent;border-bottom:25px solid transparent;}.xxx--triangle--purple{border-left:25px solid #fff;border-top:25px solid transparent;border-bottom:25px solid transparent;}.xxx--triangle--turquoise{border-left:35px solid #fff;border-top:35px solid transparent;border-bottom:35px solid transparent;}.xxx--triangle--yellow{border-left:50px solid #fff;border-top:50px solid transparent;border-bottom:50px solid transparent;}.xxx--triangle--red{border-left:50px solid #fff;border-top:50px solid transparent;border-bottom:50px solid transparent;}.xxx--square--orange{background-color:#fff;width:35px;height:35px;}.xxx--parallelogram--green{background-color:#fff;width:32px;height:35px;}' +
                '</style>' +
                "<div id='elm-live:elmCompilingBackground' style='z-index: 100; transition: opacity " +
                animation.speed +
                "ms; opacity: 0; position: fixed; top: 0; left: 0; background-color: rgba(0,0,0,0.3); width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; flex-direction: column'>" +
                "<div onclick='elmLive.hideCompiling()' style='background-color: rgba(0,0,0,0); position: fixed; top:0; left:0; bottom:0; right:0'></div>" +

                '<div class="xxx xxx--basic" style="transform: translate(-80px,-170px)">' +
                '<div class="xxx--triangle xxx--triangle--pink"></div>' +
                '<div class="xxx--triangle xxx--triangle--purple"></div>' +
                '<div class="xxx--square xxx--square--orange"></div>' +
                '<div class="xxx--triangle xxx--triangle--turquoise"></div>' +
                '<div class="xxx--triangle xxx--triangle--yellow"></div>' +
                '<div class="xxx--triangle xxx--triangle--red"></div>' +
                '<div class="xxx--parallelogram xxx--parallelogram--green"></div>' +
                '</div>' +

                "<div id='loading'>" +
                '</div>' +
                "<div style='text-align: center; color: #fff; padding: 30px; font-size: 24px; font-weight: bold; font-family: sans-serif'>" +
                (message || '') +
                '</div>' +
                '</div>'
    setTimeout(function () {
      document.getElementById('elm-live:elmCompilingBackground').style.opacity = 1
    }, animation.delay)
    setTimeout(function () {
      rotateTangram()
    }, 500)
  }

  function hideCompiling (noAnimation) {
    var animation = speedAndDelay(noAnimation)
    var node = document.getElementById('elm-live:elmCompilingContainer')
    if (node) {
      document.getElementById('elm-live:elmCompilingBackground').style.opacity = 0
      setTimeout(function () {
        document.getElementById('elm-live:elmCompilingContainer').remove()
      }, animation.speed)
    }
  }

  // Check to see if the server sent us reload (meaning a manually reload event was fired) and then reloads the page
  var socketOnMessage = function (msg) {
    var parsedData
    try {
      parsedData = JSON.parse(msg.data)
    } catch (e) {
      parsedData = ''
      if (verboseLogging) {
        console.log('Error parsing', msg.data)
      }
    }

    if (parsedData.action === 'error') {
      // Displaying the Elm compiler error in the console
      // and in the browsers
      showError(parsedData.error, parsedData.cwd, parsedData.ide)
    } else if (parsedData.action === 'hotReload') {
      hideCompiling()
      if (verboseLogging) {
        console.log('Hot Reload', parsedData.url)
      }
      // The following 13 lines are from https://github.com/klazuka/elm-hot/blob/master/test/client.js#L22
      var myRequest = new Request(parsedData.url)
      myRequest.cache = 'no-cache'
      fetch(myRequest).then(function (response) {
        if (response.ok) {
          response.text().then(function (value) {
            module.hot.apply()
            delete Elm;
            eval(value)
          })
        } else {
          console.error('HMR fetch failed:', response.status, response.statusText)
        }
      })
    } else if (parsedData.action === 'coldReload') {
      hideCompiling()
      window.location.reload()
    } else if (parsedData.action === 'compiling') {
      showCompiling(parsedData.message)
    }
  }

  var socketOnOpen = function (msg) {
    if (verboseLogging) {
      console.log('Socket Opened')
    }

    // We only allow the reload on two conditions, one when the socket closed (firstChange === true) and two if we didn't navigate to a new page (navigatedAwayFromPageFlag === false)
    if (firstChangeFlag === true && navigatedAwayFromPageFlag !== true) {
      if (verboseLogging) {
        console.log('Reloaded')
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

    window.elmLive = {
      hideError: hideError,
      hideCompiling: hideCompiling
    }
  }
})()
