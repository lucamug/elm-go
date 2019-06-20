const chalk = require('chalk')


const image1 = `
╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬
╬╬╬╬╬████████╬╬╬╬╬
╬╬╬╬█▒▒▒▓▓▓▓▓█╬╬╬╬
╬╬╬█▒▒▒▓▓▓▓▓▓▓█╬╬╬
╬╬╬█▒▒▒▓▓▓▓▓▓▓█╬╬╬
╬╬╬█▒  ░░░░▓▓▓█╬╬╬
╬╬╬█▒  ░░░░░▓▓█╬╬╬
╬╬╬█▒ █░░░█░▓░█╬╬╬
╬╬╬█   ░░░░░░░█╬╬╬
╬╬╬█  █████░░░█╬╬╬
╬╬╬█   ░░░░░░░█╬╬╬
╬╬╬╬█   ░░░░░█╬╬╬╬
╬╬╬█ ████████░█╬╬╬
╬╬█ ░░░░░░░░░░░█╬╬
╬█ ░░░░░░░░░█ ░░█╬
╬█  ██  ░░░░██ ░█╬
╬█ ░░█  ░░░░█ ░░█╬
╬█  ░█▒▒▓▓▓▓█  ░█╬
╬╬████▒▒▓▓▓▓████╬╬
╬╬╬╬╬█▒▓██▒▓█╬╬╬╬╬
╬╬╬╬╬███╬╬███╬╬╬╬╬
╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬`


const image2 = `
╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬
╬╬╬╬╬╬╬╬╬╬████████████████╬╬╬╬╬╬╬╬╬╬
╬╬╬╬╬╬╬╬██▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒██╬╬╬╬╬╬╬╬
╬╬╬╬╬╬██▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒██╬╬╬╬╬╬
╬╬╬╬╬╬██▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒██╬╬╬╬╬╬
╬╬╬╬╬╬██▓▓░░░░        ▒▒▒▒▒▒██╬╬╬╬╬╬
╬╬╬╬╬╬██▓▓░░░░          ▒▒▒▒██╬╬╬╬╬╬
╬╬╬╬╬╬██▓▓░░██      ██  ▒▒  ██╬╬╬╬╬╬
╬╬╬╬╬╬██░░░░░░              ██╬╬╬╬╬╬
╬╬╬╬╬╬██░░░░██████████      ██╬╬╬╬╬╬
╬╬╬╬╬╬██░░░░░░              ██╬╬╬╬╬╬
╬╬╬╬╬╬╬╬██░░░░░░          ██╬╬╬╬╬╬╬╬
╬╬╬╬╬╬██░░██████░░░░░░░░░░  ██╬╬╬╬╬╬
╬╬╬╬██░░                      ██╬╬╬╬
╬╬██░░                  ██░░    ██╬╬
╬╬██░░░░████░░░░   ░░░░ ████░░  ██╬╬
╬╬██░░    ██░░          ██░░    ██╬╬
╬╬██░░░░  ██▓▓▒▒▒▒▒▒▒▒▒▒██░░░░  ██╬╬
╬╬╬╬████████▓▓▒▒▒▒▒▒▒▒▒▒████████╬╬╬╬
╬╬╬╬╬╬╬╬╬╬██▓▓▒▒████▓▓▒▒██╬╬╬╬╬╬╬╬╬╬
╬╬╬╬╬╬╬╬╬╬██████╬╬╬╬██████╬╬╬╬╬╬╬╬╬╬
╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬`


const color = {
  '╬': '#444444', // Dark Gray
  '█': '#000000', // Black
  '▓': '#c66e12', // Brown
  '▒': '#F0AD00', // Orange
  '░': '#5A6378', // Dark Blue
  ' ': '#60B5CC', // Cyan
}


function paint(image, indentation, comment, xScale) {
  xScale = xScale || 1
  indentation = indentation || ""
  comment = comment.split(/\n/)
  const i = image.split(/\n/).splice(1)
  const height = i.length
  const width = i[0].length
  var outcome = []
  for (var y = 0; y < height - 1; y += 2) {
    var row = []
    for (var x = 0; x < width; x += xScale) {
      row.push(chalk['bgHex'](color[i[y][x]])['hex'](color[i[y + 1][x]])('▄'));
    }
    outcome.push(indentation + row.join('') + (comment && comment[y / 2] ? comment[y / 2] : ""))
  }
  if (height % 2 === 1) {
    var row = []
    for (var x = 0; x < width; x += xScale) {
      row.push(chalk['bgHex'](color[i[height - 1][x]])(' '));
    }
    outcome.push(indentation + row.join(''))
  }
  return outcome.join("\n");
}


const comment = `  Terminal
  Pixel
  Art`

console.log("\n")
console.log(paint(image2, "    ", comment, 2))
console.log("\n")
