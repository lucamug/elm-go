const chalk = require('chalk')

logoElm = [
  'ggggcccc',
  'bggggccc',
  'bboooocc',
  'bbbooggc',
  'bbbxgggo',
  'bbxccgoo',
  'bxccccoo',
  'xcccccco',
]

color = {
  g: '#7FD13B', // Green
  c: '#60B5CC', // Cyan
  b: '#5A6378', // Blue
  o: '#F0AD00', // Orange
  x: '#4d8fa1', // Dark Cyan
  y: '#78898b', // Gray
  _: '#333333', // Black
}

function paint(image, indentation, text) {
  indentation = indentation || ""
  height = image.length
  width = image[0].length
  for (var y = 0; y < height - 1; y += 2) {
    var row = []
    for (var x = 0; x < width; x++) {
      var pixel = addColor(chalk, image[y][x], true)
      pixel = addColor(pixel, image[y + 1][x])
      row.push(pixel('▄')); // ▀▄
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
      row.push(pixel(' ')); // ▀▄
    }
    console.log(indentation, row.join(''))
  }
}

function addColor(pixel, point, bg) {
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
    return bg ? pixel.bgBlackBright : pixel.gray
  } else {
    return pixel
  }
}

console.log("\n")
paint(logoElm, "    ", [, , `  ${chalk.hex(color.c)('Elm Live')}`, `  A flexible dev server for Elm`])
console.log("\n")
