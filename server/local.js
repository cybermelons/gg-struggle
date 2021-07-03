// Locally run gg-struggle server

const fs = require('fs')
const ggstruggle = require('./gg-struggle')


let options = {
  cert: fs.readFileSync('./gg-struggle-cert.pem'),
  key: fs.readFileSync('./gg-struggle-key.pem'),
  passphrase: 'totsugeki',
  port: 443,
  dumpDir: process.env.TEMP + '/gg-struggle/dumps',
  sqliteDb: process.env.TEMP + '/gg-struggle/gg-struggle.db',
}

let app = ggstruggle.createLocalServer(options)
app.listen()
