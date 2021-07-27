const EventEmitter = require('events')
const SmartBuffer = require('smart-buffer').SmartBuffer;
const fs = require('fs')
const hash = require('object-hash')
const https = require('https')
const log4js = require('log4js')
const parseTime = require('parse-duration')
const sqlite3 = require('sqlite3')

class CacheLayer extends EventEmitter {
  constructor(options) {
    super(options)
    // 3 layers of storage
    this.cache = new Map() // 1. in-memory
                           // 2. persistent
                           // 3. fetch data
    this.cachePolicy = options.cachePolicy
    this.cachePolicy.memoized = new Map()
    this.ggHost = options.ggHost
    this.ggIp = options.ggIp
  }

  // spaghetti
  getCacheExpireTime = (url) => {
    if (url in this.cachePolicy.memoized) {
      return this.cachePolicy.memoized[url]
    }

    let expiryStr = this.getExpireString(url)

    const expDuration = (expiryStr === '-1') ? -1 : parseTime(expiryStr)
    if (expDuration === null) {
      log4js.getLogger().error(`[CACHE] ${url} could not parse expiry string: ${expiryStr}`)
    }

    this.cachePolicy.memoized[url] = expDuration
    if (expDuration !== -1) {
      let expTimeMin = parseTime(expDuration, 'm')
      log4js.getLogger().debug(`[CACHE] ${url} expDuration ${expDuration}`)
      log4js.getLogger().debug(`[CACHE] ${url} given expire time of ${expTimeMin}`)
    }
    return expDuration
  }

  getExpireString = (url) => {
    let routes = this.cachePolicy.routes
    for (const regexStr in routes) {
      const regex = new RegExp(regexStr)
      if (regex.test(url)) {
        log4js.getLogger().debug(`[CACHE] Matched regex for url ${url}: ${regexStr}min`)
        return routes[regexStr]
      }
    }

    return this.cachePolicy.default
  }

  shouldCache = (url) => {
    const should =  this.getCacheExpireTime(url) > 0
    log4js.getLogger().debug(`[CACHE] shouldCache(${url}): ${should}`)
    return should
  }

  isItemExpired = (ggResp) => {
    const expireTime = ggResp.timeStart + this.getCacheExpireTime(ggResp.url)
    const expired = Date.now() > expireTime
    log4js.getLogger().debug(`[CACHE] expired(${ggResp.key}): timeStart:${ggResp.timeStart} expireTime:${expireTime} ${expired}`)
    return Date.now() > expireTime
  }

  set = (key, ggResp) => {
    this.cache.set(key, ggResp)
  }

  get = (gameReq, callback) => {
    // fetch and run callback on the response.
    // the response may either be cached or live.
    //
    // current caching strategy:
    //  miss - wait for payload, then cache and return
    //  hits - return cached data, and refresh payload in background

    // need get to return the buffer
    const key = gameReq.key

    if (this.contains(gameReq)) {
      this.emit('cache-hit', gameReq)
      let ggResp = this.cache.get(key)
      callback(ggResp)

      // default - do nothing with fetched data
      let doNothing = (d) => {}
      let storeIfExpired = (data) => {
        if (this.isItemExpired(ggResp)) {
          this.set(key, data)
          log4js.getLogger().debug(`[CACHE] Cached response from gg: ${gameReq.key}`)
        }
      }

      // store the response if cache policy says so
      let fetchCallback =
        this.shouldCache(gameReq.url) ? storeIfExpired : doNothing

      // always send request to gg, even if not caching
      log4js.getLogger().info(`[CACHE] Sending request to gg: ${gameReq.key}`)
      this.fetchGg(gameReq, fetchCallback)
    }

    else {
      this.emit('cache-miss', gameReq)
      this.fetchGg(gameReq, (data) => {
        this.set(key, data)
        callback(data)
      })
    }
  }


  fetchGg = (gameReq, callback) => {
    const key = gameReq.key
    const options = {
      hostname: this.ggIp,
      port: 443,
      path: gameReq.url,
      method: gameReq.method,
      headers: {
        'Host': 'ggst-game.guiltygear.com',
        'user-agent': 'Steam',
        'accept': '*/*',
        'content-type': 'application/x-www-form-urlencoded',
        'connection': 'keep-alive',
      },
    }

    // create ggRequest
    console.time(`gg-req ${key}`)


    let cachedResp = {
      statusCode: null,
      headers: null,
      payloadSize: 0,    // size of buffer on disk
      buffer: new SmartBuffer(),
      key: gameReq.key, // used to find payload data
      url: gameReq.url,
      method: gameReq.method,

      timeStart: Date.now(),
      timeEnd: null,
    }

    const ggReq = https.request(options, (ggResp) => {
      // set headers before any writing happens
      cachedResp.statusCode = ggResp.statusCode
      cachedResp.headers = ggResp.headers

      ggResp.on('data', d => {
        // when we get payload data from gg, write it to cache and back to game
        cachedResp.buffer.writeBuffer(d)
      })

      ggResp.on('end', (e) => {
        log4js.getLogger().debug(`[CACHE] Writing response ${gameReq.url} ${gameReq.method} ${key} to cache`)
        cachedResp.timeEnd = Date.now()
        cachedResp.payloadSize = cachedResp.buffer.toBuffer().length
        this.emit('fetch', cachedResp)
        this.cache.set(gameReq.key, cachedResp)

        callback(cachedResp)
        console.timeEnd(`gg-req ${key}`)
      })

      ggResp.on('error', e => {
        log4js.getLogger().warn(`[CACHE] Error in response from gg servers: ${e}`)
        log4js.getLogger().warn(`[CACHE] Bailed on caching response from GG`)
        this.cache.remove(key)
        console.timeEnd(`gg-req ${key}`)
      })
    })

    // send the request.
    ggReq.headers = gameReq.headers
    ggReq.statusCode = gameReq.statusCode
    ggReq.key = gameReq.key
    ggReq.end(gameReq.buffer.toBuffer())
  }


  contains(gameReq) {
    // TODO invalidate old requests
    return this.cache.has(gameReq.key)
  }
}

class DbLayer {
  // responsible for saving the requests and responses

  constructor(db, dumpDir) {
    this.db = db
    this.dumpDir = dumpDir
  }

  init = () => {
    this.db.serialize( () => {
      this.db.run(`CREATE TABLE IF NOT EXISTS requests (
        dumpKey TEXT PRIMARY KEY ON CONFLICT IGNORE,
        headers BLOB,
        method TEXT,
        url TEXT,
        payloadSize INTEGER,

        timeStart INTEGER,
        timeEnd INTEGER
      );`);

      this.db.run(`CREATE TABLE IF NOT EXISTS responses (
        dumpKey TEXT PRIMARY KEY ON CONFLICT IGNORE,
        headers BLOB,
        method TEXT,
        url TEXT,
        payloadSize INTEGER,
        statusCode INTEGER,

        timeStart INTEGER,
        timeEnd INTEGER
      );`)
      ;
    })

    // make sure the dump directory exists
    if (!fs.existsSync(this.dumpDir)) {
      fs.mkdirSync(this.dumpDir)
    }
  }

  forEachReqResp = (callback) => {
    // sql statement to get (req, resp)
    const stmt = `
      SELECT
        req.dumpkey as dumpKey,
        req.url as url,
        req.method as method,
        req.headers as reqHeaders,
        req.timeStart as reqTimeStart,
        req.timeEnd as reqTimeEnd,

        resp.statusCode as respStatusCode,
        resp.headers as respHeaders,
        resp.payloadSize as respPayloadSize,
        resp.timeStart as respTimeStart,
        resp.timeEnd as respTimeEnd
      FROM requests AS req
      LEFT JOIN responses AS resp USING (dumpKey)
    `

    this.db.all(stmt, [], (err, rows) => {
      if (err) {
        const logger = log4js.getLogger()
        logger.warn(`[DB] Error reading ${key} from db: ${err}`)
        return
      }

      rows.forEach( (row) => {
        const key = row.dumpKey

        try {
          const reqFile = `${this.dumpDir}/${key}.gameReq.dump`
          const respFile = `${this.dumpDir}/${key}.ggResp.dump`
          const httpReq = {
            headers: JSON.parse(row.reqHeaders),
            method: row.method,
            url: row.url,
          }

          const reqBuffer = new SmartBuffer()
          reqBuffer.writeBuffer(fs.readFileSync(reqFile))   // not very node-like but whatever

          const gameReq = new GameRequest(httpReq, reqBuffer)

          const ggResp = {
            statusCode: row.respStatusCode,
            headers: JSON.parse(row.respHeaders),
            payloadSize: row.respPayloadSize,
            buffer: new SmartBuffer(),

            key: row.dumpKey, // used to find payload data
            url: row.url,
            method: row.method,

            timeStart: row.respTimeStart,
            timeEnd: row.respTimeEnd,
          }
          ggResp.buffer.writeBuffer(fs.readFileSync(respFile))

          callback(gameReq, ggResp)
        } catch (err) {
          log4js.getLogger().warn(`[DB] Error reading request ${key}: ${err}`)
        }
      })
    })
  }

  _readRequestDb = (key) => {

    stmt.on('error', (err) => {
      log4js.getLogger().warn(`_writeRequestDb: Error writing request to db: ${err}`)
    })

    stmt.run(req.key, JSON.stringify(req.headers),
      req.method, req.url,
      req.payloadSize,
      req.timeStart, req.timeEnd)
  }

  putRequest(gameReq) {
    // insert into db
    this._writeRequestDb(gameReq)

    // write to file
    const dumpFile = `${this.dumpDir}/${gameReq.key}.gameReq.dump`
    log4js.getLogger().info(`[DB] Dumping request to ${dumpFile}`)
    const reqLog = fs.createWriteStream(dumpFile)
    reqLog.write(gameReq.buffer.toBuffer())
    reqLog.close()
  }

  _writeRequestDb(req)
  {
    var stmt = this.db.prepare(`INSERT INTO requests VALUES (?, ?, ?, ?, ?, ?, ?)
    ;`);

    stmt.on('error', (err) => {
      log4js.getLogger().warn(`_writeRequestDb: Error writing request to db: ${err}`)
    })

    stmt.run(req.key, JSON.stringify(req.headers),
      req.method, req.url,
      req.payloadSize,
      req.timeStart, req.timeEnd)

  }

  updateRequestTime(gameReq) {
    var stmt = this.db.prepare(`UPDATE requests
      SET timeEnd = ?
      WHERE (dumpKey == ? AND timeStart == ?)
    ;`)
    stmt.on('error', (err) => {
      log4js.getLogger().warn(`updateRequestTime: Error writing request to db: ${err}`)
    })
    stmt.run(Date.now(), gameReq.key, gameReq.timeStart)
  }



  putResponse(resp) {
    this._writeResponseDb(resp)

    const dumpFile = `${this.dumpDir}/${resp.key}.ggResp.dump`
    const respLog = fs.createWriteStream(dumpFile)

    log4js.getLogger().log(`[DB] Dumping response to ${dumpFile}`)
    respLog.write(resp.buffer.toBuffer())
    respLog.close()
  }


  _writeResponseDb(resp) {
    var stmt = this.db.prepare(`INSERT INTO responses VALUES (?, ?, ?, ?, ?, ?, ?, ?) ;`)

    stmt.on('error', (err) => {
      log4js.getLogger().warn(`_writeResponseDb: Error writing request to db: ${err}`)
    })
    stmt.run(resp.key, JSON.stringify(resp.headers),
      resp.method, resp.url,
      resp.payloadSize, resp.statusCode,
      resp.timeStart, resp.timeEnd)
  }
}


var DB
function getDb(dbFile, dumpDir) {
  if (! (DB) ) {
    var sqldb = new sqlite3.Database(dbFile, (err) => {
      if (err) {
        log4js.getLogger().warn(`[DB] Error connecting to db ${dbFile}: ${err}`)
      }
      else {
        log4js.getLogger().log(`[DB] Connected to db ${dbFile}`)
      }
    })

    DB = new DbLayer(sqldb, dumpDir)
    DB.init()
  }

  return DB
}

function isUsingHttps() {
  return process.env.GGST_SSL_CERT && process.env.GGST_SSL_KEY
}

class GameRequest {
  constructor(httpReq, reqBuffer) {
    this.headers = httpReq.headers
    this.method = httpReq.method
    this.url = httpReq.url

    this.payloadSize = reqBuffer.toBuffer().length
    this.buffer = reqBuffer

    const { url, method } = httpReq
    const body = reqBuffer.toBuffer()
    this.key = hash({url, method, body})

    this.timeStart =  Date.now()
    this.timeEnd = null
  }

  write(data) {
    this.buffer.writeBuffer(d)
    this.payloadSize = reqBuffer.toBuffer().length
  }
}



class GgStruggleServer {
  constructor(options) {
    this.options = options

    const logger = log4js.getLogger()

    // set up cache and database
    this.respCache = new CacheLayer(options)
    var db = getDb(options.sqliteDb, options.dumpDir)
    this.db = db

    logger.info(`[DB] Loading entries ${options.sqliteDb}`)
    db.forEachReqResp( (gameReq, ggResp) => {
      this.respCache.set(ggResp.key, ggResp)
      logger.debug(`[CACHE] Loaded response ${gameReq.key} into cache`)

      // print debug stuff
    })

    // log real server responses whenever the cache hits it
    this.respCache.on('fetch', (ggResp) => {
      logger.info(`[DB] Storing ${ggResp.key} response into db`)
      db.putResponse(ggResp)
    })

    // enable some cache notifications
    this.respCache.on('cache-miss', (gameReq) => {
      logger.info(`[CACHE] Miss: ${gameReq.url} ${gameReq.method} ${gameReq.key}`)
    })
    this.respCache.on('cache-hit', (gameReq) => {
      logger.info(`[CACHE] Hit: ${gameReq.url} ${gameReq.method} ${gameReq.key}`)
    })

    // create the server
    let app = https.createServer(this.options, this.handleGameReq)
    this.app = app

    app.on('clientError', (e, socket) => {
      logger.error(`[PROXY] Error connecting client via TLS: ${e}`)
    })

  }

  listen() {
    this.app.listen(this.options, () => {
      log4js.getLogger().info(`[PROXY] Listening on ${this.options.port}`)
    })
  }


  handleGameReq = (httpReq, gameResp) => {
    console.time('gg-struggle api request')

    const logger = log4js.getLogger()

    // time the response
    gameResp.on('finish', () => {
      console.timeEnd('gg-struggle api request')
    })
    gameResp.on('error', (e) => {
      logger.error(`Error writing response to game: ${e}`)
      console.timeEnd('gg-struggle api request')
    })


    // write the game's request to a buffer
    const reqBuffer = new SmartBuffer()
    httpReq.on('data', (d) => {
      reqBuffer.writeBuffer(d)
    })


    httpReq.on('end', () => {

      let gameReq = new GameRequest(httpReq, reqBuffer)

      logger.info(`[PROXY] ${gameReq.url} ${gameReq.method} ${gameReq.key}`)

      // store the game request and responses into a persistent db
      getDb().putRequest(gameReq)


      // copy the cache response back to user
      this.respCache.get(gameReq, (ggResp) => {
        gameResp.writeHead(ggResp.statusCode, ggResp.headers)
        gameResp.end(ggResp.buffer.toBuffer())
      })

      // record the time we respond to the game
      gameResp.on('close', () => {
        log4js.getLogger().debug(`[DB] Updating end time on req ${gameReq.key}`)
        gameReq.timeEnd = Date.now()
        this.db.updateRequestTime(gameReq)
      })

    })
  }
}


exports.createLocalServer = (options) => {
  // create a local server. if keyFile or certFile are defined
  // in options, read from those files instead of using raw plaintext keys

  if (('certFile' in options)) {
    log4js.getLogger().info(`[PROXY] Using cert and key files: ${options.certFile}, ${options.keyFile}`)
    options.key = fs.readFileSync(options.keyFile)
    options.cert = fs.readFileSync(options.certFile)
  }
  else if ('pfxFile' in options) {
    log4js.getLogger().info(`[PROXY] Using pfx file ${options.pfxFile}`)
    options.pfx = fs.readFileSync(options.pfxFile)
  }
  else {
    log4js.getLogger().error('[PROXY] No cert provided. ')
  }

  let ggServer = new GgStruggleServer(options)
  return ggServer

}


