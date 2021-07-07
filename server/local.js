// Locally run gg-struggle server. Meant to be packaged to windows

const fs = require('fs')
const log4js = require('log4js')
const nconf = require('nconf')
var parseTime = require('parse-duration')

const ggstruggle = require('./gg-struggle')


try {
  nconf.file(name, { file: 'config.json' });

  // let options = {
  //   //certFile: './gg-struggle-cert.pem',
  //   //keyFile: './gg-struggle-cert.key',
  //   pfxFile: './gg-struggle-cert.pfx',
  //   passphrase: 'totsugeki',
  //   port: 443,

  //   rootDir: process.env.TEMP + '/gg-struggle/',
  //   dumpDir: process.env.TEMP + '/gg-struggle/dumps',
  //   sqliteDb: process.env.TEMP + '/gg-struggle/gg-struggle.db',
  //   ggHost: 'ggst-game-real.guiltygear.com'
  //
  // }
  //
  //

  log4js.configure( {
    appenders: {
      everything: { type: 'file', filename: `${options.rootDir}/all.log`, },
      out: { type: 'stdout' },
      //error: { type: 'file', filename: `${options.rootDir}/error.log`, },
      //info: { type: 'file', filename: `${options.rootDir}/info.log`, },
    },
    categories: {
      default: { appenders: [ 'everything', 'out' ], level: 'info', },
      //error: { appenders: [ 'error', 'everything' ], level: 'error', },
      //info: { appenders: [ 'info', 'everything' ], level: 'info', },
    },
  })

  let app = ggstruggle.createLocalServer(nconf.get('options'))
  app.listen()

} catch (err) {

  console.error(`[PROXY] Caught error at top-level: ${err}`)
  console.error(`Aborting...`)

  const logger = log4js.getLogger()
  logger.error(err)
  process.exit()
}
