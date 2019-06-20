const chalk = require('chalk')

logoElm = `
▚▚▚▚░░░░
.▚▚▚▚░░░
..▒▒▒▒░░
...▒▒▚▚░
...◣▚▚▚▒
..◣░░▚▒▒
.◣░░░░▒▒
◣░░░░░░▒`

logoMario = `
___________
_██▓▓▓▓▓██_
██▓▓▓▓▓▓▓██
█▓▓▓▓▓▓▓▓▓█
███████████
███████████
█░░░░░░◣◣◣█
██░░░░░◣◣██
█▓█░░░░◣█▓█
█▓▓▓███▓▓▓█
█▓▓▓▓▓▓▓▓▓█
█▓▓▓▓▓▓▓▓▓█
█▓▓▓▓▓▓▓▓▓█
█▓▓▓▓▓▓▓▓▓█
█▓▓▓▓▓▓▓▓▓█
█▓▓▓▓▓▓▓▓▓█
.▓▓▓▓▓▓▓▓▓.
_........._`



color = {
  '█': '#eeeeee', // White
  '▒': '#F0AD00', // Orange
  '▞': '#c66e12', // Brown
  '▓': '#c81616', // Red
  '▚': '#7FD13B', // Green
  '░': '#60B5CC', // Cyan
  '◣': '#4d8fa1', // Dark Cyan
  '.': '#5A6378', // Dark Blue
  '_': '#000000', // Black

}

function paint(image, indentation, text) {

  function addColor(pixel, point, bg) {
    return pixel[bg ? 'bgHex' : 'hex'](color[point])
  }

  image = image.split(/\n/).splice(1)
  var outcome = []
  var indentation = indentation || ""
  var height = image.length
  var width = image[0].length
  for (var y = 0; y < height - 1; y += 2) {
    var row = []
    for (var x = 0; x < width; x++) {
      var pixel = addColor(chalk, image[y][x], true)
      pixel = addColor(pixel, image[y + 1][x])
      row.push(pixel('▄'));
    }
    if (text && text[y / 2]) {
      outcome.push(indentation + row.join('') + text[y / 2])
    } else {
      outcome.push(indentation + row.join(''))
    }
  }
  if (height % 2 === 1) {
    var row = []
    for (var x = 0; x < width; x++) {
      var p1 = image[height - 1][x]
      pixel = addColor(chalk, p1, true)
      row.push(pixel(' '));
    }
    outcome.push(indentation + row.join(''))
  }
  return outcome.join("\n");
}


console.log("\n")
console.log(paint(logoMario, "    ", [, , , `  Mario`]))
console.log("\n")
console.log(paint(logoElm, "    ", [, , `  ${chalk.hex(color['░'])('Elm Live')}`, `  A flexible dev server for Elm`]))
console.log("\n")
