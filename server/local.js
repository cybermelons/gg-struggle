// Locally run gg-struggle server. Meant to be packaged to windows

const fs = require('fs')
const log4js = require('log4js')
const nconf = require('nconf')
const os = require('os')

const ggstruggle = require('./gg-struggle')


try {
  nconf.file(process.argv[2])

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

  var options = nconf.get('options')

  if (options.rootDir === "__TEMP__") {
    // TODO set config default values in nconf
    options.rootDir = os.tmpdir() + '/gg-struggle'
  }

  options.sqliteDb = options.rootDir + '/gg-struggle.db'
  options.dumpDir = options.rootDir + '/dumps'

  log4js.configure( {
    appenders: {
      everything: { type: 'file', filename: `${options.rootDir}/all.log`, },
      out: { type: 'stdout' },
      //error: { type: 'file', filename: `${options.rootDir}/error.log`, },
      //info: { type: 'file', filename: `${options.rootDir}/info.log`, },
    },
    categories: {
      default: { appenders: [ 'everything', 'out' ], level: options.logLevel },
      //error: { appenders: [ 'error', 'everything' ], level: 'error', },
      //info: { appenders: [ 'info', 'everything' ], level: 'info', },
    },
  })

  let app = ggstruggle.createLocalServer(options)
  app.listen()

} catch (err) {

  console.error(`[PROXY] Caught error at top-level: ${err}`)
  console.error(`Aborting...`)

  const logger = log4js.getLogger()
  logger.error(err)
  process.exit()
}
