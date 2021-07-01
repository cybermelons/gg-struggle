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

    //this.db = new sqlite3.Database(process.env.SQLITE_DB)
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
      let payload = this.cache.get(key)
      callback(payload)

      // only refresh items if expired
      if (Date.now() > payload.time + EXPIRE_TIME_MS) {
        console.log(`${gameReq.key} Refreshing because expired`)
        this.fetchGg(gameReq, (data) => {
          this.cache.set(key, data)
          this.emit('fetch', data)
        })
      }
    }

    else {
      this.emit('cache-miss', gameReq)
      this.fetchGg(gameReq, (data) => {
        this.cache.set(key, data)
        this.emit('fetch', data)
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
    console.time(`gg-req ${gameReq.key}`)
    const ggReq = https.request(options, (ggResp) => {
      console.debug(`Attempting to get ggResponse`)

      // set headers before any writing happens
      let cachedResp = {
        statusCode: ggResp.statusCode,
        headers: ggResp.headers,
        payloadSize: 0,    // size of buffer on disk
        buffer: new SmartBuffer(),
        key: key, // used to find payload data

        timeStart: Date.now(),
        timeEnd: null,
      }

      ggResp.on('data', d => {
        // when we get payload data from gg, write it to cache and back to game
        cachedResp.buffer.writeBuffer(d)
      })

      ggResp.on('end', (e) => {
        console.debug(`Writing ${gameReq.url} ${gameReq.method} ${gameReq.key} to cache`)
        cachedResp.timeEnd = Date.now()
        cachedResp.payloadSize = cachedResp.buffer.toBuffer().size
        this.cache.set(gameReq.key, cachedResp)

        callback(cachedResp)
        console.timeEnd(`gg-req ${key}`)
      })

      ggResp.on('data', data => {
        cachedResp.buffer.writeBuffer(data)
      })

      ggResp.on('error', e => {
        console.error(`Error in response from gg servers: ${e}`)
        console.error(`Bailed on caching response from GG`)
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
    return gameReq.key in this.cache
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
    const reqLog = fs.createWriteStream(`${DUMP_DIR}/${gameReq.key}.gameReq.dump`)
    reqLog.write(gameReq.buffer.toBuffer())
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
    console.log('udpateReqTime')
    var stmt = this.db.prepare(`UPDATE requests
      SET timeEnd = ?
      WHERE (dumpKey == ?
        AND timeStart == ?)
      LIMIT 1
    ;`)
    stmt.on('error', (err) => {
      console.error(`updateRequestTime: Error writing request to db: ${err}`)
    })
    stmt.run(Date.now(), gameReq.key, gameReq.timeStart)
  }



  putResponse(resp) {
    this._writeResponseDb(resp)

    const respLog = fs.createWriteStream(`${DUMP_DIR}/${resp.key}.ggResp.dump`)
    respLog.write(resp.buffer.toBuffer())
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

function getCache() {
  return CACHE_LAYER
}

function getDb() {
  if (! (DB) ) {
    var sqldb = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        console.error(`Error connecting to db ${DB_FILE}: ${err}`)
      }
      else {
        console.log(`Connected to db ${DB_FILE}`)
      }
    })

    DB = new DbLayer(sqldb, DUMP_DIR)
    DB.init()
  }

  return DB
}

getDb()

function isUsingHttps() {
  return process.env.GGST_SSL_CERT && process.env.GGST_SSL_KEY
}

class GameRequest {
  constructor(httpReq, reqBuffer) {
    this.headers = httpReq.headers
    this.method = httpReq.method
    this.url = httpReq.url

    this.payloadSize = 0
    this.buffer = reqBuffer

    const { url, method } = httpReq
    const body = reqBuffer.toString()
    this.key = hash({url, method, body})

    this.timeStart =  Date.now()
    this.timeEnd = null
  }

  write(data) {
    this.buffer.writeBuffer(d)
  }
}


function handleGameReq(httpReq, gameResp) {
  console.time('gg-struggle api request')
  // time the response
  gameResp.on('finish', () => {
    console.timeEnd('gg-struggle api request')
  })
  gameResp.on('error', (e) => {
    console.error(`Error writing response to game: ${e}`)
    console.timeEnd('gg-struggle api request')
  })


  const reqBuffer = new SmartBuffer()
  httpReq.on('data', (d) => {
    reqBuffer.writeBuffer(d)
  })

  const db = getDb()
  const respCache = getCache()

  httpReq.on('end', () => {

    let gameReq = new GameRequest(httpReq, reqBuffer)

    console.log(`[GAMEREQ] ${gameReq.url} ${gameReq.method} ${gameReq.key}`)

    // store the game request and responses into a persistent db
    db.putRequest(gameReq)


    // copy the cache response back to user
    respCache.get(gameReq, (ggResp) => {
      gameResp.writeHead(ggResp.statusCode, ggResp.headers)
      gameResp.end(ggResp.buffer.toBuffer())
    })

    // record the time we respond to the game
    gameResp.on('end', () => {
      gameReq.timeEnd = Date.now()
      db.updateRequestTime(gameReq)
    })

  })
}


var CACHE_LAYER = new CacheLayer()
var DB

let createServer = http.createServer
let serverOpts = {
  port: 3000
}

// Use HTTPS if specified
if (isUsingHttps()) {
  console.log('Enabling HTTPS')
  createServer = https.createServer
  serverOpts = {
    ...serverOpts,
    key: fs.readFileSync(process.env.GGST_SSL_KEY),
    cert: fs.readFileSync(process.env.GGST_SSL_CERT),
    passphrase: process.env.GGST_SSL_PASS,
    enableTrace: true,
    port: 443
  }
}

const db = getDb()
const respCache = getCache()

respCache.on('fetch', (ggResp) => {
  console.log(`Storing ${ggResp.key} response into db`)
  db.putResponse(ggResp)
})

respCache.on('cache-miss', (gameReq) => {
  console.log(`Cache miss: ${gameReq.url} ${gameReq.method} ${gameReq.buffer.toBuffer()}`)
})
respCache.on('cache-hit', (gameReq) => {
  console.log(`Cache hit: ${gameReq.url} ${gameReq.method} ${gameReq.buffer.toBuffer()}`)
})

let app = createServer(serverOpts, handleGameReq)

app.listen(serverOpts, () => {
  console.log(`Listening on ${serverOpts.port}`)
})

app.on('clientError', (e, socket) => {
  console.error(`Error connecting client via TLS: ${e}`)
})


