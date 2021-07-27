// Locally run gg-struggle server. Meant to be packaged to windows

const fs = require('fs')
const log4js = require('log4js')
const nconf = require('nconf')
const os = require('os')

const ggstruggle = require('./gg-struggle')

try {
  var cfg = 'server/local.json'
  if (process.argv.length < 3) {
    console.error(`[PROXY] No config specified. Using default ${cfg}`)
  }
  else {
    cfg = process.argv[2]
  }

  nconf.file(cfg)
  var options = nconf.get('options')

  if (options.rootDir === "__TEMP__") {
    // TODO set config default values in nconf
    options.rootDir = os.tmpdir() + '/gg-struggle'
  }

  options.sqliteDb = options.rootDir + '/gg-struggle.db'
  options.dumpDir = options.rootDir + '/dumps'

  options.logFile = `${options.rootDir}/all.log`
  log4js.configure( {
    appenders: {
      everything: { type: 'file', filename: options.logFile, },
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

  log4js.getLogger().info(`[PROXY] Logging to ${options.logFile}`)


  // resolve ip of gg servers at runtime
  dnsPromises.setServers([
    '4.4.4.4',
    '8.8.8.8',
  ])
  dnsPromises(resolve4(this.ggHost)).catch( (err) => {
    log4js.getLogger().error(`[PROXY] Cannot resolve ${options.ggHost}`)
    process.exit()
  })
  .then ( (addresses) => {
    options.ggIp = addresses[0]
    let app = ggstruggle.createLocalServer(options)
    app.listen()
  })

} catch (err) {

  console.error(`[PROXY] Caught error at top-level: ${err}`)
  console.error(`Aborting...`)
  log4js.getLogger().error(err)
  process.exit()
}
