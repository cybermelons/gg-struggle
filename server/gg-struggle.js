const http = require('http')
const https = require('https')
const hash = require('object-hash')
const fs = require('fs')
const sqlite3 = require('sqlite3')
const EventEmitter = require('events')
const SmartBuffer = require('smart-buffer').SmartBuffer;

const EXPIRE_TIME_MS = 1000 * 60 * 60 * 60 * 24 // max cache-age: 1 day

const DUMP_DIR = process.env.GGST_DUMP_DIR ? process.env.GGST_DUMP_DIR : './dumps/'
const DB_FILE = process.env.GGST_SQLITE_DB ? process.env.GGST_SQLITE_DB  : 'gg-struggle.db'

// [ ] time the times each route takes
// [ ] sort routes by payload size
// [ ] sort routes by average time taken
// /api/route POST data=abcd1234 -> binarydata..{}.
//
class CacheLayer extends EventEmitter {
  constructor(props) {
    super(props)
    // TODO use redis or something

    // 3 layers of storage
    this.cache = new Map() // in-memory
                           // persistent
                           // fetch data
  }

  get(gameReq, callback) {
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

      // only refresh items if expired
      if (Date.now() > ggResp.timeStart + EXPIRE_TIME_MS) {
        console.log(`[CACHE] Refreshing key because expired: ${gameReq.key}`)
        this.fetchGg(gameReq, (data) => {
          this.emit('fetch', data)
          this.cache.set(key, data)
        })
      }
    }

    else {
      this.emit('cache-miss', gameReq)
      this.fetchGg(gameReq, (data) => {
        this.emit('fetch', data)
        this.cache.set(key, data)
        callback(data)
      })
    }
  }

  fetchGg(gameReq, callback) {
    const key = gameReq.key
    const options = {
      hostname: 'ggst-game.guiltygear.com',
      port: 443,
      path: gameReq.url,
      method: gameReq.method,
      headers: {
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
        console.debug(`[CACHE] Writing response ${gameReq.url} ${gameReq.method} ${key} to cache`)
        cachedResp.timeEnd = Date.now()
        cachedResp.payloadSize = cachedResp.buffer.toBuffer().length
        this.cache.set(gameReq.key, cachedResp)

        callback(cachedResp)
        console.timeEnd(`gg-req ${key}`)
      })

      ggResp.on('error', e => {
        console.error(`[CACHE] Error in response from gg servers: ${e}`)
        console.error(`[CACHE] Bailed on caching response from GG`)
        this.cache.remove(key)
        console.timeEnd(`gg-req ${key}`)
      })
    })

    // send the request.
    ggReq.headers = gameReq.headers
    ggReq.statusCode = gameReq.statusCode
    ggReq.key = gameReq.key
    ggReq.end(gameReq.buffer.toBuffer())

    return ggReq;
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

  init()
  {
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
  }

  putRequest(gameReq) {
    // insert into db
    this._writeRequestDb(gameReq)

    // write to file
    const dumpFile = `${this.dumpDir}/${gameReq.key}.gameReq.dump`
    console.log(`[DB] Dumping request to ${dumpFile}`)
    const reqLog = fs.createWriteStream(dumpFile)
    reqLog.write(gameReq.buffer.toBuffer())
    reqLog.close()
  }

  _writeRequestDb(req)
  {
    var stmt = this.db.prepare(`INSERT INTO requests VALUES (?, ?, ?, ?, ?, ?, ?)
    ;`);

    stmt.on('error', (err) => {
      console.error(`_writeRequestDb: Error writing request to db: ${err}`)
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
      console.error(`updateRequestTime: Error writing request to db: ${err}`)
    })
    stmt.run(Date.now(), gameReq.key, gameReq.timeStart)
  }



  putResponse(resp) {
    this._writeResponseDb(resp)

    const dumpFile = `${this.dumpDir}/${resp.key}.ggResp.dump`
    const respLog = fs.createWriteStream(dumpFile)

    console.log(`[DB] Dumping response to ${dumpFile}`)
    respLog.write(resp.buffer.toBuffer())
    respLog.close()
  }


  _writeResponseDb(resp) {
    var stmt = this.db.prepare(`INSERT INTO responses VALUES (?, ?, ?, ?, ?, ?, ?, ?) ;`)

    stmt.on('error', (err) => {
      console.error(`_writeResponseDb: Error writing request to db: ${err}`)
    })
    stmt.run(resp.key, JSON.stringify(resp.headers),
      resp.method, resp.url,
      resp.payloadSize, resp.statusCode,
      resp.timeStart, resp.timeEnd)
  }
}

var CACHE_LAYER
function getCache() {
  if (! (CACHE_LAYER)) {
    CACHE_LAYER = new CacheLayer()
  }

  return CACHE_LAYER
}

var DB
function getDb(dbFile, dumpDir) {
  if (! (DB) ) {
    var sqldb = new sqlite3.Database(dbFile, (err) => {
      if (err) {
        console.error(`[DB] Error connecting to db ${dbFile}: ${err}`)
      }
      else {
        console.log(`[DB] Connected to db ${dbFile}`)
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
  }
}



class GgStruggleServer {
  constructor(options) {
    this.options = options

    // set up cache and database
    this.respCache = new CacheLayer()
    this.db = getDb(options.sqliteDb, options.dumpDir)

    // log real server responses whenever the cache hits it
    this.respCache.on('fetch', (ggResp) => {
      console.log(`[DB] Storing ${ggResp.key} response into db`)
      db.putResponse(ggResp)
    })

    // enable some cache notifications
    this.respCache.on('cache-miss', (gameReq) => {
      console.log(`[CACHE] Miss: ${gameReq.url} ${gameReq.method} ${gameReq.buffer.toBuffer()}`)
    })
    this.respCache.on('cache-hit', (gameReq) => {
      console.log(`[CACHE] Hit: ${gameReq.url} ${gameReq.method} ${gameReq.buffer.toBuffer()}`)
    })

    // create the server
    let app = https.createServer(this.options, this.handleGameReq)
    this.app = app

    app.on('clientError', (e, socket) => {
      console.error(`[PROXY] Error connecting client via TLS: ${e}`)
    })

  }

  listen() {
    this.app.listen(this.options, () => {
      console.log(`[PROXY] Listening on ${this.options.port}`)
    })
  }


  handleGameReq(httpReq, gameResp) {
    console.time('gg-struggle api request')

    // time the response
    gameResp.on('finish', () => {
      console.timeEnd('gg-struggle api request')
    })
    gameResp.on('error', (e) => {
      console.error(`Error writing response to game: ${e}`)
      console.timeEnd('gg-struggle api request')
    })


    // write the game's request to a buffer
    const reqBuffer = new SmartBuffer()
    httpReq.on('data', (d) => {
      reqBuffer.writeBuffer(d)
    })


    httpReq.on('end', () => {

      let gameReq = new GameRequest(httpReq, reqBuffer)

      console.log(`[PROXY] ${gameReq.url} ${gameReq.method} ${gameReq.key}`)

      // store the game request and responses into a persistent db
      getDb().putRequest(gameReq)


      // copy the cache response back to user
      this.respCache.get(gameReq, (ggResp) => {
        gameResp.writeHead(ggResp.statusCode, ggResp.headers)
        gameResp.end(ggResp.buffer.toBuffer())
      })

      // record the time we respond to the game
      gameResp.on('close', () => {
        console.log(`[DB] Updating end time on req ${gameReq.key}`)
        gameReq.timeEnd = Date.now()
        db.updateRequestTime(gameReq)
      })

    })
  }
}


exports.createLocalServer = (options) => {
  let ggServer = new GgStruggleServer(options)
  return ggServer
}


