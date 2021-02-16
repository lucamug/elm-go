const qrcode = require('qrcode')
const ip = require('ip')
const chalk = require('chalk')
const header = chalk.dim('elm-go:')

color = {
  g: '#7FD13B', // Green
  c: '#60B5CC', // Cyan
  b: '#5A6378', // Blue
  o: '#F0AD00', // Orange
  x: '#4d8fa1', // Dark Cyan
  y: '#78898b', // Gray
  _: '#000000'  // Black
}

qrCodeColor1 = '_'

qrCodeColor2 = 'g'

function qr(port) {
  const address = 'http://' + ip.address() + ':' + port // my ip address
  setTimeout(function () {
    console.log(`\n${header}
  Use ${chalk.blue.bold(address)} to access the server
  from a different device or scan the QR code below.\n`)
    qrcode.toString(address, { type: 'utf8' }, function (err, string) {
      if (err) throw err
      paint(removeMargin(qrToLogo(string), 3), ' ')
    })
  }, 0)
}

function qrToLogo(qr) {
  var result = []
  qr.split(/\n/).map(function(row, index) {
    var row1 = []
    var row2 = []
    row.split('').map(function(char, index2) {
      if (char === '█') {
        row1.push(qrCodeColor1)
        row2.push(qrCodeColor1)
      } else if (char === '▄') {
        row1.push(qrCodeColor2)
        row2.push(qrCodeColor1)
      } else if (char === '▀') {
        row1.push(qrCodeColor1)
        row2.push(qrCodeColor2)
      } else {
        row1.push(qrCodeColor2)
        row2.push(qrCodeColor2)
      }
    })
    result.push(row1.join(''), row2.join(''))
  }).join('\n')
  return result
}

function paint (image, indentation, text) {
  indentation = indentation || ''
  height = image.length
  width = image[0].length
  for (var y = 0; y < height - 1; y += 2) {
    var row = []
    for (var x = 0; x < width; x++) {
      var pixel = addColor(chalk, image[y][x], true)
      pixel = addColor(pixel, image[y + 1][x])
      row.push(pixel('▄')) // ▀▄
    }
    if (text && text[y / 2]) {
      console.log(indentation, row.join(''), text[y / 2])
    } else {
      console.log(indentation, row.join(''))
    }
  }
  if (height % 2 === 1) {
    var row = []
    for (var x = 0; x < width; x++) {
      var p1 = image[height - 1][x]
      pixel = addColor(chalk, p1, true)
      row.push(pixel(' ')) // ▀▄
    }
    console.log(indentation, row.join(''))
  }
}

function removeMargin (image, margin) {
  image.splice(-margin, margin)
  image.splice(0, margin)
  return image.map(function (row, index) {
    rowSplit = row.split('')
    rowSplit.splice(-margin, margin)
    rowSplit.splice(0, margin)
    return rowSplit.join('')
  })
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
    return bg ? pixel.bgBlack : pixel.black
  } else {
    return pixel
  }
}

exports.qr = qr;
