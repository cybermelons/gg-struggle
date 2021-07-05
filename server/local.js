// Locally run gg-struggle server. Meant to be packaged to windows

const fs = require('fs')
const ggstruggle = require('./gg-struggle')

let options = {
  cert: fs.readFileSync('./gg-struggle.pem'),
  key: fs.readFileSync('./gg-struggle.key'),
  passphrase: 'totsugeki',
  port: 443,

  rootDir: process.env.TEMP + '/gg-struggle/',
  dumpDir: process.env.TEMP + '/gg-struggle/dumps',
  sqliteDb: process.env.TEMP + '/gg-struggle/gg-struggle.db',
  ggHost: 'ggst-game-real.guiltygear.com'
}

let app = ggstruggle.createLocalServer(options)
app.listen()
