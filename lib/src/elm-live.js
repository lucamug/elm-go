/*
  ({
    outputStream: WritableStream,
    inputStream: ReadableStream,
  }) =>
    exitCode: Integer | Null
*/
module.exports = (argv, options) => {
  const args = Object.assign(
    {
      port: argv.port || 8000,
      pathToElm: argv.pathToElm || 'elm',
      host: argv.host || 'localhost',
      dir: argv.dir || process.cwd(),
      open: argv.open || false,
      recover: argv.recover !== false,
      pushstate: argv.pushstate || false,
      proxyPrefix: argv.proxyPrefix || false,
      proxyHost: argv.proxyHost || false,
      ssl: argv.ssl || false,
      elmMakeArgs: argv.args || [],
      startPage: argv.startPage || 'index.html',
      notifyBrowser: argv.notifyBrowser,
      hotReloading: argv.hotReloading,
      ide: argv.ide,
      verbose: argv.verbose
    },
    (argv.beforeBuild ? { beforeBuild: argv.beforeBuild } : {}),
    (argv.afterBuild ? { afterBuild: argv.afterBuild } : {})
  )

  const outputStream = options.outputStream
  const inputStream = options.inputStream

  const SUCCESS = 0
  const FAILURE = 1

  const chalk = require('chalk')
  const path = require('path')
  const spawnSync = require('cross-spawn').sync
  const elmServe = require('./elm-serve')
  const chokidar = require('chokidar')
  const debounce = require('./debounce')
  const getSourceDirs = require('./get-source-dirs')
  const elmHot = require('elm-hot')
  const fs = require('fs')
  const ip = require('ip')
  const qrcodeTerminal = require('qrcode-terminal');
  const qrcode = require('qrcode');
  const termImg = require('term-img');
  const terminalImage = require('terminal-image');
  const consolePng = require('console-png');
  const emoji = require('node-emoji');

  const imageFile = __dirname + '/elm_8x8(1).png'


logo = [
    'ggggcccc' ,
    'bggggccc' ,
    'bboooocc' ,
    'bbbooggc' ,
    'bbbxgggo' ,
    'bbxccgoo' ,
    'bxccccoo' ,
    'xcccccco' ,
  ]



color = {
    g: '#7FD13B', // Green
    c: '#60B5CC', // Cyan
    b: '#5A6378', // Blue
    o: '#F0AD00', // Orange
    x: '#4d8fa1', // Dark Cyan
    y: '#888888', // Gray
    _: '#333333', // Black
}

function paint (image, indentation, text) {
    indentation = indentation || ""
    height = image.length
    width = image[0].length
    for (var y = 0; y < height - 1; y += 2) {
        var row = []
        for (var x = 0; x < width; x++) {
            var pixel = addColor(chalk, image[y][x], true)
            pixel = addColor(pixel, image[y+1][x])
            row.push(pixel('▄')); // ▀▄
       }
       if (text && text[y/2]) {
           console.log(indentation, row.join(''), text[y/2])
       } else {
           console.log(indentation, row.join(''))
       }
    }
    if (height % 2 === 1) {
        var row = []
        for (var x = 0; x < width; x++) {
            var p1 = image[height-1][x]
            pixel = addColor(chalk, p1, true)
            row.push(pixel(' ')); // ▀▄
        }
        console.log(indentation, row.join(''))
    }
}

function addColor (pixel, point, bg) {
    if (point === 'g') {
        return bg ? pixel.bgHex(color.g) : pixel.hex(color.g)
    } else if (point === 'c') {
        return bg ? pixel.bgHex(color.c) : pixel.hex(color.c)
    } else if (point === 'b') {
        return bg ? pixel.bgHex(color.b) : pixel.hex(color.b)
    } else if (point === 'o') {
        return bg ? pixel.bgHex(color.o) : pixel.hex(color.o)
    } else if (point === 'x') {
        return bg ? pixel.bgHex(color.x) : pixel.hex(color.x)
    } else if (point === 'y') {
        return bg ? pixel.bgHex(color.y) : pixel.hex(color.y)
    } else if (point === '_') {
        return bg ? pixel.bgHex(color._) : pixel.hex(color._)
    } else {
        return pixel
    }
}


console.log("\n")
paint(logo, "    ", [,,`  ${chalk.hex(color.c)('Elm Live')}`, `  ${chalk.dim('A flexible dev server for Elm')}`])

console.log("\n")

// qrcode.toString("ciao", {margin: 1, scale: 1}, function(err, string) {
//   if (err) throw err
//   console.log(string)
// })

qrcode.toString('ciao',{type: 'utf8'}, function (err, string) {
  if (err) throw err
  paint( removeMargin( qrToLogo(string), 3), "    " )
})

function qrToLogo(qr) {
    // console.log(qr);
    var result = [];
    qr.split(/\n/).map(function(row, index) {
        var row1 = [];
        var row2 = [];
        row.split('').map(function(char, index2) {
            if (char === '█') {
                row1.push('_')
                row2.push('_')
            } else if (char === '▄') {
                row1.push('y')
                row2.push('_')
            } else if (char === '▀') {
                row1.push('_')
                row2.push('y')
            } else {
                row1.push('y')
                row2.push('y')
            }
        })
        result.push(row1.join(''), row2.join(''))
    }).join("\n");
    return result;
}

function removeMargin(image, margin) {
    image.splice( -margin , margin)
    image.splice(0,margin)
    return image.map(function(row, index) {
        rowSplit = row.split('')
        rowSplit.splice( -margin , margin)
        rowSplit.splice(0,margin)
        return rowSplit.join('');
    });
}


function orange(x) { return chalk.hex(color.o)(x === "I" ? x.toLowerCase() : x) }

// const animation = [`◢`,`◣`,`◤`,`◥`]
// const animation = [`._\\^`,`:-|~`,`'^/_`,`:-|~`]
// const animation = [`.:':.:':.:':.:':\\`,`:':.:':.:':.:':.|`,`':.:':.:':.:':.:/`, `:.:':.:':.:':.:'|`]
const animation = [ `/_~^~_~^~ Compiling! _~^~_~^~\\`.replace(/[\\/\^ol!]/g, orange )
                  , `| _~^~_~^ Compiling! ~^~_~^~_|`.replace(/[\|\^mg]/g, orange )
                  ,`\\^~_~^~_~ Compiling! ^~_~^~_~/`.replace(/[\\/\^pn]/g, orange )
                  , `|~^~_~^~_ CompIling! ~_~^~_~^|`.replace(/[\|\^CIi]/g, orange )
                  ,`${emoji.get('star')} ✨  Compiled in 34ms ✨ ${emoji.get('star')}        `
                  ]

var count = 0

function animate(position) {
    const pos = (position >= 0 && position < 4) ? position : 0
    process.stdout.write(`    ${animation[pos]}\n`);
    count++;
    if (count < 160) {
        setTimeout(function(){ animate( pos + 1 ) }, 70)
    } else {
        console.log(`    ${animation[4]}`)
    }
}

animate()




// process.exit()




// terminalImage.file(imageFile);
//
//
// var image = require('fs').readFileSync(imageFile);
//
// consolePng(image, function (err, string) {
//   if (err) throw err;
//   splitted = string.split(/\n/)
//   console.log("\n\n");
//   for (var i=0; i < splitted.length; i++) {
//       if (i == 3) {
//           console.log(`    ` + splitted[i] + `    ${chalk.cyan('elm-live')}`)
//       } else {
//           console.log(`    ` + splitted[i])
//       }
//   }
//   console.log("\n\n");
//   // console.log(" ", string.split(/\n/).join("\n  "));
// });
//
//
// const terminalLink = require('terminal-link');
//
// const link = terminalLink('My Website', 'https://sindresorhus.com');
// console.log("\n\n", link, "\n\n");
//
//
//
//
//
//     function fallback() {
//         // Do something else when not supported
//         console.log("\033[1B")
//
//     }
//
//     termImg(imageFile, {fallback});
//     // console.log("\033[0A", "ciao")
//     // console.log("\033[2C","\033[1A","aaaa")
//   const address = 'http://' + ip.address() + ':' + args.port // my ip address
//
//   qrcodeTerminal.generate(address, {small: true}, function(qrcode) {
//       console.log(`Use this address to check the app on your mobile:
//       ${chalk.cyan(address)}
//       ${chalk.cyan(qrcode.split(/\n/).join("\n  "))}`);
//   })
//
//   const qrCodeImage = args.dir + '/.qrcode.png'
//
//   qrcode.toFile(qrCodeImage, address, {margin: 1, scale: 1}, function() {
//     var image2 = require('fs').readFileSync(qrCodeImage);
//
//     consolePng(image2, function (err, string) {
//       if (err) throw err;
//       console.log("xx ", string.split(/\n/).join("\nxx  "));
//       console.log("\n\n");
//     });
//   })

  const log = function (message) {
    if (args.verbose) {
      console.log('\n' + chalk.yellow(message) + '\n')
    }
  }

  // Hot Reload Configuration
  var targetJs
  var outputArg = args.elmMakeArgs.filter(function (element) { return element.match(/^--output=/) })[0]
  if (outputArg) {
    targetJs = outputArg.match(/--output=(.*)/)[1]
  }
  if (!targetJs) {
    args.hotReloading = false
  }
  // Need to calculate the path of the compiled Elm relative to the server
  var relativePathCompiledJs = targetJs.replace(args.dir, '')
  if (args.hotReloading) {
    console.log(`
${chalk.dim('elm-live:')}
  ${chalk.bold('Hot Reloading is ON')}

  Hot Reloading swap the Elm code without reloading the page, preserving the
  state of the app.

  ${chalk.bold('Warning')}: Hot Reloading does not replay the messages of the app but just
  save and restore the state. This may bring the app to a wrong state.
  If this happen, reload the app in the browser manually.
`)
  }

  const sendMessage = function (data) {
    if (webServer && webServer.sendMessage) {
      var stringifiedData = JSON.stringify(data)
      webServer.sendMessage(stringifiedData)
      log('Sent data: ' + stringifiedData)
    } else {
      log('I could not send data: ' + stringifiedData)
    }
  }

  var webServer
  var elmStdout
  var elmStderr
  var parsedError

  function restoreColor (parsedError) {
    // This function is similar to "restoreColor" in elm-reload-client.js
    // They should be kept in sync, manually
    var coloredError = parsedError.errors.map(function (err) {
      return err.problems.map(function (pro) {
        var headerContent = '-- ' + pro.title.replace('-', ' ') + ' --------------- ' + err.path // + " at " + pro.region.start.line + ":" + pro.region.start.column
        var header = chalk.cyan(headerContent) + '\n\n'
        return [header].concat(pro.message.map(function (mes) {
          if (typeof mes === 'string') {
            return mes
          } else {
            if (mes.underline) {
              return chalk.green(mes.string)
            } else if (mes.color === 'yellow') {
              return chalk.yellow(mes.string)
            } else if (mes.color === 'red') {
              return chalk.red(mes.string)
            } else {
              return mes.string
            }
          }
        })).join('')
      }).join('\n\n\n')
    }).join('\n\n\n\n\n')
    return coloredError
  }

  const auxiliaryBuild = execPath => {
    const process = spawnSync(execPath, [], {
      stdio: [inputStream, outputStream, outputStream]
    })

    if (process.error && process.error.code === 'ENOENT') {
      outputStream.write(
        `
${chalk.dim('elm-live:')}
  I can’t find the command ${chalk.bold(execPath)}!
  Please make sure you can call ${chalk.bold(execPath)}
  from your command line.

`
      )

      return { fatal: true, exitCode: FAILURE }
    } else if (process.error) {
      outputStream.write(
        `
${chalk.dim('elm-live:')}
  Error while calling ${chalk.bold(execPath)}! This output may be helpful:

  ${process.error}

`
      )
    }

    if (args.recover && process.status !== SUCCESS) {
      outputStream.write(
        `
${chalk.dim('elm-live:')}
  ${chalk.bold(execPath)} failed! You can find more info above. Keep calm
  and take your time to check why the command is failing. We’ll try
  to run it again as soon as you change an Elm file.

`
      )
    }

    return { fatal: false, exitCode: process.status }
  }

  // Build logic
  const build = () => {
    if (args.hasOwnProperty('beforeBuild')) {
      const beforeBuild = auxiliaryBuild(args.beforeBuild)
      if (beforeBuild.exitCode !== SUCCESS) {
        return beforeBuild
      }
    }

    const hrTime1 = new Date().getTime()
    const elmMake = spawnSync(args.pathToElm, ['make', ...args.elmMakeArgs, '--report=json'])
    const hrTime2 = new Date().getTime()
    console.log("Built in " + ( hrTime2 - hrTime1 ).toString() + "ms.")

    if (elmMake.status === SUCCESS && args.hotReloading) {
      const compiledJs = fs.readFileSync(targetJs, 'utf8')
      const injectedCode = elmHot.inject(compiledJs)
      fs.writeFileSync(targetJs, injectedCode)
    }

    elmStdout = elmMake.stdout.toString()
    elmStderr = elmMake.stderr.toString()

    var coloredError = ''
    if (elmStderr) {
      try {
        parsedError = JSON.parse(elmStderr)
        coloredError = restoreColor(parsedError)
      } catch (e) {
        parsedError = {}
        coloredError = elmStderr
      }
    }

    if (elmStdout || elmStderr) {
      outputStream.write(
        `
${chalk.dim('elm-make:')}
${coloredError}
`)
    }
    if (elmMake.error && elmMake.error.code === 'ENOENT') {
      outputStream.write(
        `
${chalk.dim('elm-live:')}
  I can’t find the command ${chalk.bold(args.pathToElm)}!
  Looks like ${chalk.bold('elm')} isn’t installed. Make sure you’ve followed
  the steps at https://github.com/elm/compiler and that you can call
  ${chalk.bold(args.pathToElm)} from your command line.

  If that fails, have a look at open issues:
  https://github.com/wking-io/elm-live/issues .

`
      )

      return { fatal: true, exitCode: FAILURE }
    } else if (elmMake.error) {
      outputStream.write(
        `
${chalk.dim('elm-live:')}
  Error while calling ${chalk.bold('elm make')}! This output may be helpful:

  ${elmMake.error}

`
      )
    }

    if (args.recover && elmMake.status !== SUCCESS) {
      outputStream.write(
        `
${chalk.dim('elm-live:')}
  ${chalk.bold('elm make')} failed! You can find more info above. Keep calm
  and take your time to fix your code. We’ll try to compile it again
  as soon as you change a file.

`
      )
    }

    if (args.hasOwnProperty('afterBuild')) {
      const afterBuild = auxiliaryBuild(args.afterBuild)
      if (afterBuild.exitCode !== SUCCESS) {
        return afterBuild
      }
    }

    return { fatal: false, exitCode: elmMake.status }
  }

  // Server logic
  let serverStarted
  const startServer = () => {
    outputStream.write(
      `
${chalk.dim('elm-live:')}
  The build has succeeded. Starting the server!${args.open
    ? ` We’ll open your app
  in the default browser as soon as it’s up and running.`
    : ''}

`
    )
    var elmServeReturn = elmServe({
      watchDir: args.dir,
      port: args.port,
      host: args.host,
      open: args.open,
      dir: args.dir,
      pushstate: args.pushstate,
      verbose: args.verbose,
      proxyPrefix: args.proxyPrefix,
      proxyHost: args.proxyHost,
      startPage: args.startPage,
      ssl: args.ssl
    })
    elmServeReturn.startServer(function (ws) {
      webServer = ws
      // Initial reload (in case there are other tabs open in the browser)
      if (args.hotReloading) {
        sendMessage({ action: 'hotReload', url: relativePathCompiledJs })
      } else {
        sendMessage({ action: 'coldReload' })
      }
      serverStarted = true
    })
  }

  // First build
  const firstBuildResult = build()
  if (
    firstBuildResult.fatal ||
    (!args.recover && firstBuildResult.exitCode !== SUCCESS)
  ) {
    return firstBuildResult.exitCode
  } else if (firstBuildResult.exitCode === SUCCESS) {
    startServer()
  }

  const eventNameMap = {
    add: 'added',
    addDir: 'added',
    change: 'changed',
    unlink: 'removed',
    unlinkDir: 'removed'
  }

  const packageFileNames = ['elm.json', 'elm-package.json']

  const isPackageFilePath = (relativePath) => {
    return packageFileNames.indexOf(relativePath) > -1
  }

  const watchElmFiles = () => {
    const sourceDirs = getSourceDirs()

    outputStream.write(
      `
${chalk.dim('elm-live:')}
  Watching
    ${sourceDirs.join('\n    ')}.

`
    )

    let watcher = chokidar.watch(sourceDirs.concat(packageFileNames), {
      ignoreInitial: true,
      followSymlinks: false,
      ignored: 'elm-stuff/generated-code/*'
    })

    watcher.on(
      'all',
      debounce((event, filePath) => {
        const relativePath = path.relative(process.cwd(), filePath)
        const eventName = eventNameMap[event] || event
        const message = `You’ve ${eventName} \`${relativePath}\`. Rebuilding!`

        outputStream.write(
          `
${chalk.dim('elm-live:')}
${message}

`
        )

        if (argv.notifyBrowser) {
          sendMessage({ action: 'compiling', message: message })
        }
        const buildResult = build()
        if (buildResult.exitCode === SUCCESS) {
          if (args.hotReloading) {
            sendMessage({ action: 'hotReload', url: relativePathCompiledJs })
          } else {
            sendMessage({ action: 'coldReload' })
          }
        } else {
          if (argv.notifyBrowser) {
            sendMessage({ action: 'error', ide: args.ide, cwd: process.cwd(), error: parsedError })
          }
        }

        if (!serverStarted && buildResult.exitCode === SUCCESS) {
          startServer()
        }

        if (isPackageFilePath(relativePath)) {
          // Package file changes may result in changes to the set
          // of watched files
          watcher.close()
          watcher = watchElmFiles()
        }
      }),
      100
    )
  }

  watchElmFiles()

  return null
}
