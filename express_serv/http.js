const http = require('http')
const https = require('https')
const hash = require('object-hash')
const fs = require('fs')
const SmartBuffer = require('smart-buffer').SmartBuffer;

const EXPIRE_TIME_MS = 1000 * 60 * 60 * 60 * 24 // max cache-age: 1 day

//var sqlite3 = require('sqlite3').verbose();
//var db = new sqlite3.Database(process.env.SQLITE_DB);
//
//db.run("CREATE TABLE IF NOT EXISTS ggstruggle (info TEXT)");
//
//var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
//for (var i = 0; i < 10; i++) {
//    stmt.run("Ipsum " + i);
//}
//stmt.finalize();
//
//db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
//    console.log(row.id + ": " + row.info);
//});
//
//db.close();

// [ ] time the times each route takes
// [ ] sort routes by payload size
// [ ] sort routes by average time taken
// /api/route POST data=abcd1234 -> binarydata..{}.
class CacheLayer {
  constructor() {
    // TODO use redis or something
    this.storage = {}
  }

  _makeKey(req, reqBuffer) {
    // hashing the request with
    //    method, url, body
    const {url, method} = req
    const body = reqBuffer.toString()
    return hash({url, method, body})
  }

  createLogFiles(req, reqBuffer) {
    const key = this._makeKey(req, reqBuffer)
    return {
      gameReqFile : fs.createWriteStream(`dumps/${key}.gameReq.dump`),
      ggRespFile : fs.createWriteStream(`dumps/${key}.ggResp.dump`),
    }
  }

  get(req, reqBuffer, callback) {
    // fetch the request's response and run callback on it.
    // the response may either be cached or live.
    //
    // current caching strategy:
    //  miss - wait for payload, then cache and return
    //  hits - return cached data, and refresh payload in background

    // need get to return the buffer
    const key = this._makeKey(req, reqBuffer)

    if (this.contains(req, reqBuffer)) {
      let payload = this.storage[key]
      callback(this.storage[key])

      // only refresh items if expired
      if (Date.now() > payload.time + EXPIRE_TIME_MS) {
        this.fetchGg(req, reqBuffer, (data) => {
          this.storage[key] = data
        })
      }
    }

    else {
      this.fetchGg(req, reqBuffer, (data) => {
        this.storage[key] = data
        callback(data)
      })
    }
  }

  fetchGg(req, reqBuffer, callback) {
    const key = this._makeKey(req, reqBuffer)
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
      let cachedResp = {
        headers: ggResp.headers,
        statusCode: ggResp.statusCode,
        ggReqTimeStart: Date.now(),
        buffer: new SmartBuffer(),
      }

      ggResp.on('data', d => {
        // when we get payload data from gg, write it to cache and back to game
        cachedResp.buffer.writeBuffer(d)
      })

      ggResp.on('end', (e) => {
        console.debug(`Writing ${req.url} ${req.method} ${key} to cache`)
        cachedResp.ggReqTimeEnd = Date.now()
        this.storage[key] = cachedResp
        callback(cachedResp)
        console.timeEnd(`gg-req ${key}`)
      })

      // write response to log
      const ggRespLog = fs.createWriteStream(`${process.env.GGST_DUMP_DIR}/${key}.ggResp.dump`)
      ggResp.on('data', d => {
        ggRespLog.write(data)
      })

      ggResp.on('error', e => {
        console.error(`Error in response from gg servers: ${e}`)

        console.error(`Bailed on caching response from GG`)
        delete this.storage[key]
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
    return key in this.storage
  }
}
var CACHE_LAYER = new CacheLayer()

function getStorage() {
  return CACHE_LAYER
}

function isUsingHttps() {
  return process.env.GGST_SSL_CERT && process.env.GGST_SSL_KEY
}


function handleGameReq(gameReq, gameResp) {
  console.time('gg-struggle api request')
  // time the response
  gameResp.on('finish', () => {
    console.timeEnd('gg-struggle api request')
  })
  gameResp.on('error', (e) => {
    console.error(`Error writing response to game: ${e}`)
    console.timeEnd('gg-struggle api request')
  })

  // store the incoming request stream into a buffer
  var gameReqBuffer = new SmartBuffer()
  gameReq.on('data', (d) => {
    gameReqBuffer.writeBuffer(d)
  })


  // then once the buffer is filled, start processing
  // TODO put this into a function
  gameReq.on('end', () => {

    // copy the cached gg response into the game's response buffer
    const storage = getStorage()
    const key = getStorage()._makeKey(gameReq, gameReqBuffer)

    storage.get(gameReq, gameReqBuffer, (data) => {
      gameResp.writeHead(data.statusCode, data.headers)
      gameResp.end(data.buffer.toBuffer())
    })

    console.log(`[GAMEREQ] ${gameReq.url} ${gameReq.method} ${key}`)

    if (storage.contains(gameReq, gameReqBuffer)) {
      // return cached resp
      console.log(`Cache hit: ${gameReq.url} ${gameReq.method} ${gameReqBuffer.toBuffer()}`)
    }
    else {
      console.log(`Cache miss: ${gameReq.url} ${gameReq.method} ${gameReqBuffer.toBuffer()}`)
    }


    const gameReqLog = fs.createWriteStream(`${process.env.GGST_DUMP_DIR}/${key}.gameReq.dump`)
    gameReqLog.on('error', (e) => {
      console.error(`Error writing to gameReq dump file: ${e}`)
    })

    gameReqLog.write(gameReqBuffer.toBuffer())

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


