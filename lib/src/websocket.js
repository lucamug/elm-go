
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
    }

  }
};

(function refresh () {
  const verboseLogging = '{{verbose}}' // This is dynamically update before it is sent to the browser
  const reload = '{{reload}}' // This is dynamically update by before it is sent to the browser

  const socketUrl = window.location.origin.replace(/(^http(s?):\/\/)(.*)/, 'ws$2://$3')

  if (verboseLogging) {
    console.log('Reload Script Loaded')
  }

  if (!('WebSocket' in window)) {
    throw new Error('Reload only works with browsers that support WebSockets')
  }

  /*
  |-------------------------------------------------------------------------------
  | Helpers
  |-------------------------------------------------------------------------------
  */

  const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x)

  function colorConverter (color) {
    return {
      black: '#000000',
      red: '#F77F00',
      green: '#33ff00',
      yellow: '#ffff00',
      blue: '#99B1BC',
      magenta: '#cc00ff',
      cyan: '#00ffff',
      white: '#d0d0d0',
      BLACK: '#808080',
      RED: '#ff0000',
      GREEN: '#33ff00',
      YELLOW: '#ffff00',
      BLUE: '#0066ff',
      MAGENTA: '#cc00ff',
      CYAN: '#00ffff',
      WHITE: '#ffffff',
    }[color]
  }


  const addNewLine = str => str + '\n'
  const styleColor = (str = 'WHITE') => `color: ${colorConverter(str)};`
  const styleUnderline = `text-decoration: underline;`
  const styleBold = `text-decoration: bold;`
  const parseStyle = ({ underline, color, bold }) => `${underline ? styleUnderline : ''}${color ? styleColor(color) : ''}${bold ? styleBold : ''}`

  function capitalizeFirstLetter (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  function consoleSanitize (str) {
    return str.replace(/<(http[^>]*)>/, '$1')
  }

  function htmlSanitize(str, type) {
    var temp = document.createElement('div')
    temp.textContent = str
    return temp.innerHTML.replace(/&lt;(http[^>]*)&gt;/, "&lt;<a style='color: inherit' target='_blank' href='$1'>$1</a>&gt;")
  }

  const parseHeader = (title, path) => `-- ${title.replace('-', ' ')} --------------- ${path}`

  /*
  |-------------------------------------------------------------------------------
  | Console Logging
  |-------------------------------------------------------------------------------
  */

  const wrapConsole = str => `%c${str}`
  const consoleHeader = pipe(parseHeader, wrapConsole, addNewLine, addNewLine)

  const parseMsg = pipe(consoleSanitize, wrapConsole)
  const consoleMsg = ({ error, style }, msg) => ({
    error: error.concat(parseMsg(typeof msg === 'string' ? msg : msg.string)),
    style: style.concat(parseStyle(typeof msg === 'string' ? { color: 'black' } : msg))
  })

  const joinMessage = ({ error, style }) => [error.join('')].concat(style)

  const parseConsoleErrors = path =>
    ({ title, message }) =>
      joinMessage(message
        .reduce(consoleMsg, {
          error: [consoleHeader(title, path)],
          style: [styleColor('blue')]
        }))

  const restoreColorConsole = ({ errors }) =>
    errors.reduce((acc, { problems, path }) =>
      acc.concat(problems.map(parseConsoleErrors(path))), [])

  /*
  |-------------------------------------------------------------------------------
  | Html Logging
  |-------------------------------------------------------------------------------
  */

  const htmlHeader = (title, path) => `<span style="${parseStyle({ color: 'blue' })}">${parseHeader(title, path)}</span>\n\n`

  const htmlMsg = (acc, msg) => `${acc}<span style="${parseStyle(typeof msg === 'string' ? { color: 'WHITE' } : msg)}">${htmlSanitize(typeof msg === 'string' ? msg : msg.string)}</span>`

  const parseHtmlErrors = (path) =>
  ({ title, message }) =>
    message.reduce(htmlMsg, htmlHeader(title, path))

  const restoreColorHtml = ({ errors }) =>
  errors.reduce((acc, { problems, path }) =>
    acc.concat(problems.map(parseHtmlErrors(path))), [])

  /*
  |-------------------------------------------------------------------------------
  | TODO: Refactor Below
  |-------------------------------------------------------------------------------
  */

  var speed = 400
  var delay = 20

  function showError (error) {
    restoreColorConsole(error).forEach((error) => {
      console.log.apply(this, error)
    })
    hideCompiling('fast')
    setTimeout(function () {
      showError_(restoreColorHtml(error))
    }, delay)
  }

  function showError_ (error) {
    var nodeContainer = document.getElementById('elm-go:elmErrorContainer')

    if (!nodeContainer) {
      nodeContainer = document.createElement('div')
      nodeContainer.id = 'elm-go:elmErrorContainer'
      document.body.appendChild(nodeContainer)
    }

    nodeContainer.innerHTML = `
<div
  id="elm-go:elmErrorBackground"
  style="
    z-index: 100;
    perspective: 500px;
    transition: opacity 400ms;
    position: fixed;
    top: 0;
    left: 0;
    background-color: rgba(13,31,45,0.2);
    width: 100%;
    height: 100%;
    display: flex;
    justify-content:center;
    align-items: center;
  "
>
  <div
    onclick="elmLive.hideError()"
    style="
      background-color: rgba(0,0,0,0);
      position: fixed;
      top:0;
      left:0;
      bottom:0;
      right:0
    "
  ></div>
  <pre
    id="elm-go:elmError"
    style="
      transform: rotateX(0deg);
      transition: transform 400ms;
      transform-style: preserve-3d;
      font-size: 16px;
      overflow: scroll;
      background-color: rgba(13, 31, 45, 0.9);
      color: #ddd;
      width: calc(100% - 150px);
      height: calc(100% - 150px);
      margin: 0;
      padding: 30px;
      font-family: 'Fira Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    "
  >${error}</pre>
</div>
`

    setTimeout(function () {
      document.getElementById('elm-go:elmErrorBackground').style.opacity = 1
      document.getElementById('elm-go:elmError').style.transform = 'rotateX(0deg)'
    }, delay)
  }

  function hideError (velocity) {
    var node = document.getElementById('elm-go:elmErrorContainer')
    if (node) {
      if (velocity === 'fast') {
        document.getElementById('elm-go:elmErrorContainer').remove()
      } else {
        document.getElementById('elm-go:elmErrorBackground').style.opacity = 0
        document.getElementById('elm-go:elmError').style.transform = 'rotateX(90deg)'
        setTimeout(function () {
          document.getElementById('elm-go:elmErrorContainer').remove()
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
    var nodeContainer = document.getElementById('elm-go:elmCompilingContainer')

    if (!nodeContainer) {
      nodeContainer = document.createElement('div')
      nodeContainer.id = 'elm-go:elmCompilingContainer'
      document.body.appendChild(nodeContainer)
    }

    nodeContainer.innerHTML = `
    <style>
    #loading {
      display: inline-block;
      width: 127px;
      height: 127px;
      animation: spin 7s ease-out infinite;
      transform-origin: center;
    }

    @keyframes spin {
      0% { transform: rotateY(0deg) rotate(0deg) }
      30% { transform: rotateY(360deg) rotate(360deg) }
      100% { transform: rotateY(360deg) rotate(360deg) }
    }
  </style>
  <div
    id="elm-go:elmCompilingBackground"
    style="
      z-index: 100;
      transition: opacity ${speed}ms;
      opacity: 0;
      position: fixed;
      top: 0;
      left: 0;
      background-color: rgba(255,255,255,0.9);
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    "
  >
    <div
      onclick="elmLive.hideCompiling()"
      style="
        background-color: rgba(0,0,0,0);
        position: fixed;
        top:0;
        left:0;
        bottom:0;
        right:0;
      "
    ></div>
    <div id="loading">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 680">
        <path fill="none" d="M-1-1h682v682H-1z"/>
        <g>
          <path fill="#1293d8" stroke="#000" stroke-width="1.5" d="M-1-5h693v688H-1z"/>
          <path fill="#fff" d="M59 645l280-280 280 280H59zM39 65l280 280L39 625V65zm320-20h280v280L359 45zm0 300l130 130 130-130-130-130-130 130zM59 45h260l122 122H181L59 45zm410 150L339 325 209 195h260zm170 430L509 495l130-130v260z"/>
        </g>
      </svg>
    </div>
    <div
      style="
        text-align: center;
        color: #0D1F2D;
        padding: 30px;
        font-size: 24px;
        font-weight: bold;
        font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
      "
    >${message}</div>
  </div>
`
    setTimeout(function () {
      document.getElementById('elm-go:elmCompilingBackground').style.opacity = 1
    }, delay)
  }

  function hideCompiling (velocity) {
    const node = document.getElementById('elm-go:elmCompilingContainer')
    if (node) {
      if (velocity === 'fast') {
        node.remove()
      } else {
        document.getElementById('elm-go:elmCompilingBackground').style.opacity = 0
        setTimeout(function () {
          node.remove()
        }, speed)
      }
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

    if (parsedData.action === 'failure') {
      // Displaying the Elm compiler error in the console
      // and in the browsers
      hideCompiling()
      showError(parsedData.data)
    } else if (reload && parsedData.action === 'hotReload') {
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
    } else if (reload && parsedData.action === 'coldReload') {
      hideCompiling()
      window.location.reload()
    } else if (reload && parsedData.action === 'compiling') {
      showCompiling(parsedData.message)
    } else {
      hideCompiling()
      hideError()
    }
  }

  var socketOnOpen = function (msg) {
    if (verboseLogging) {
      console.log('Socket Opened')
    }
  }

  // Socket on close event that sets flags and calls the webSocketWaiter function
  var socketOnClose = function () {
    if (verboseLogging) {
      console.log('Socket Closed - Calling webSocketWaiter')
    }

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
       const socket = new WebSocket(socketUrl);

      socket.onopen = socketOnOpen
      socket.onclose = socketOnClose
      socket.onmessage = socketOnMessage
      socket.onerror = socketOnError
    }, 500)

    window.elmLive = {
      hideError: hideError,
      hideCompiling: hideCompiling
    }
  }

  // Wait until the page loads for the first time and then call the webSocketWaiter function so that we can connect the socket for the first time
  window.addEventListener('load', function () {
    if (verboseLogging === true) {
      console.log('Page Loaded - Calling webSocketWaiter')
    }
    websocketWaiter()
  })
})()
