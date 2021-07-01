const http = require('http')
const https = require('https')
const hash = require('object-hash')
const fs = require('fs')
const SmartBuffer = require('smart-buffer').SmartBuffer;

const EXPIRE_TIME_MS = 1000 * 60 * 60 * 60 * 24 // max cache-age: 1 day

const DUMP_DIR = process.env.GGST_DUMP_DIR ? process.env.GGST_DUMP_DIR : './dumps/'

// [ ] time the times each route takes
// [ ] sort routes by payload size
// [ ] sort routes by average time taken
// /api/route POST data=abcd1234 -> binarydata..{}.
//
class CacheLayer {
  constructor() {
    // TODO use redis or something

    // 3 layers of storage
    this.cache = new Map() // in-memory

    //this.db = new sqlite3.Database(process.env.SQLITE_DB)
                    // persistent

                    // fetch data
  }

  _makeKey(req, reqBuffer) {
    // hashing the request with
    //    method, url, body
    const {url, method} = req
    const body = reqBuffer.toString()
    return hash({url, method, body})
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
      let payload = this.cache.get(key)
      callback(payload)

      // only refresh items if expired
      if (Date.now() > payload.time + EXPIRE_TIME_MS) {
        this.fetchGg(gameReq, (data) => {
          this.cache.set(key, data)
        })
      }
    }

    else {
      this.fetchGg(gameReq, (data) => {
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
      path: req.url,
      method: req.method,
      headers: {
        'user-agent': 'Steam',
        'accept': '*/*',
        'content-type': 'application/x-www-form-urlencoded',
        'connection': 'keep-alive',
      },
    }

    // create ggRequest
    console.time(`gg-req ${key}`)
    const ggReq = https.request(options, (ggResp) => {
      console.debug(`Attempting to get ggResponse`)

      // set headers before any writing happens
      let cachedData = {
        // request payload size
        // response payload size
        request: {
          headers: gameReq.headers,
          method: gameReq.method,
          url: gameReq.url,
          payloadSize: gameReq.toBuffer().size,
          buffer: SmartBuffer.fromBuffer(gameReq)
          dumpKey: gameReq.key, // used to find payload data

          timeStart: null,
          timeEnd: null,
        }

        response: {
          statusCode: ggResp.statusCode,
          headers: ggResp.headers,
          payloadSize: 0,    // size of buffer on disk
          buffer: new SmartBuffer(),
          dumpKey: key, // used to find payload data

          timeStart: Date.now(),
          timeEnd: null,
        }
      }

      let cachedResp = cachedData.response

      ggResp.on('data', d => {
        // when we get payload data from gg, write it to cache and back to game
        cachedResp.buffer.writeBuffer(d)
      })

      ggResp.on('end', (e) => {
        console.debug(`Writing ${req.url} ${req.method} ${key} to cache`)
        cachedResp.timeEnd = Date.now()
        cachedResp.payloadSize = cachedResp.buffer.toBuffer().size
        this.cache.set(key) = cachedResp

        callback(cachedResp)
        console.timeEnd(`gg-req ${key}`)
      })

      // write response to log
      const ggRespLog = fs.createWriteStream(`${DUMP_DIR}/${key}.ggResp.dump`)
      ggResp.on('data', data => {
        ggRespLog.write(data)
      })

      ggResp.on('error', e => {
        console.error(`Error in response from gg servers: ${e}`)

        console.error(`Bailed on caching response from GG`)
        this.cache.remove(key)
        console.timeEnd(`gg-req ${key}`)
      })
    })

    // send the request.
    ggReq.headers = req.headers
    ggReq.statusCode = req.statusCode
    ggReq.key = key
    ggReq.end(reqBuffer.toBuffer())

    return ggReq;
  }

  contains(req, reqBuffer) {
    // TODO invalidate old requests
    const key = this._makeKey(req, reqBuffer)
    return key in this.cache.contains(key)
  }
}
var CACHE_LAYER = new CacheLayer()

var DB = new DbLayer(process.env.GGST_SQLITE_DB, DUMP_DIR)

class DbLayer {
  constructor(dbFileName, dumpDir) {
    this.db = new sqlite3.Database(dbFileName)
    this.dumpDir = dumpDir

    this.db.run(`CREATE TABLE IF NOT EXISTS requests (
      dumpKey TEXT PRIMARY KEY,
      headers BLOB,
      method TEXT,
      url TEXT,
      payloadSize INTEGER,

      timeStart INTEGER,
      timeEnd INTEGER,
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS responses (
      dumpKey TEXT PRIMARY KEY,
      headers BLOB,
      method TEXT,
      url TEXT,
      payloadSize INTEGER,
      statusCode INTEGER,

      timeStart INTEGER,
      timeEnd INTEGER,
    )`);

  }

  putRequest(gameReq) {
    // insert into db
    this._writeDb(gameReq)

    // write to file
    const reqLog = fs.createWriteStream(`${DUMP_DIR}/${key}.gameReq.dump`)
    fs.write(gameReq.buffer.toBuffer())
  }

  _writeDb(req)
  {
    var stmt = db.prepare(`INSERT INTO requests VALUES (?, ?, ?, ?, ?, ?, ?)
    WHERE dumpKey == ?`);
    stmt.run(req.dumpKey, req.headers, req.method, req.url, req.payloadSize,
      req.timeStart, req.timeEnd)
  }

  updateRequestTime(gameReq) {
    var stmt = db.prepare(`UPDATE requests
      SET timeEnd = ?
      WHERE dumpKey == ?
        AND timeStart == ?
      LIMIT 1
    `)
    stmt.run(Date.now(), gameReq.dumpKey)
  }



  putResponse(resp) {
  }
}

function getCache() {
  return CACHE_LAYER
}

function getDb() {
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

    this.payloadSize = 0
    this.buffer = SmartBuffer.fromBuffer(reqBuffer)

    this.key = hash({this.url, this.method, this.buffer.toString()})

    timeStart: Date.now(),
    timeEnd: null,
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


  var reqBuffer = new SmartBuffer()
  httpReq.on('data', (d) => {
    reqBuffer.write(d)
  })


  httpReq.on('end', () => {

    const db = getDb()
    const respCache = getCache()
    const gameReq = new GameRequest(gameReq, reqBuffer)

    db.insertRequest(gameReq)

    respCache.get(gameReq, (ggResp) => {
      // return response back to game
      gameResp.writeHead(ggResp.statusCode, ggResp.headers)
      gameResp.end(ggResp.buffer.toBuffer())

      // store response
      db.putResponse(ggResp)
    })

    // record the time we respond to the game
    gameResp.on('end', () => {
      gameReq.timeEnd = Date.now()
      db.updateRequestTime(gameReq)
    })

    console.log(`[GAMEREQ] ${gameReq.url} ${gameReq.method} ${gameReq.key}`)

    if (respCache.contains(gameReq)) {
      // return cached resp
      console.log(`Cache hit: ${gameReq.url} ${gameReq.method} ${gameReq.buffer.toBuffer()}`)
    }
    else {
      console.log(`Cache miss: ${gameReq.url} ${gameReq.method} ${gameReq.buffer.toBuffer()}`)
    }


    // TODO
    const gameReqLog = fs.createWriteStream(`${DUMP_DIR}/${gameReq.key}.gameReq.dump`)
    gameReqLog.on('error', (e) => {
      console.error(`Error writing to gameReq dump file: ${e}`)
    })

    gameReqLog.write(gameReq.buffer.toBuffer())

  })
}



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

let app = createServer(serverOpts, handleGameReq)


app.listen(serverOpts, () => {
  console.log(`Listening on ${serverOpts.port}`)
})

app.on('clientError', (e, socket) => {
  console.error(`Error connecting client via TLS: ${e}`)
})


