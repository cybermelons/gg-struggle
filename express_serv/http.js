const https = require('https')
const http = require('http')
const hash = require('object-hash')
const fs = require('fs')
const SmartBuffer = require('smart-buffer').SmartBuffer;

const port = 3000


// now to setup storage layer

class CacheLayer {
  // WIP. for now uses in-memory cache
  constructor() {
    this.storage = {}
  }

  setWriteable(req, reqBuffer) {
    const key = this._makeKey(req, reqBuffer)

    var item = {
      buffer: new SmartBuffer(),
      headers: '',
      statusCode: ''
    }
    this.storage[key] = item
    return item
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
      gameRespFile : fs.createWriteStream(`dumps/${key}.gameResp.dump`),
      ggReqFile : fs.createWriteStream(`dumps/${key}.ggReq.dump`),
      ggRespFile : fs.createWriteStream(`dumps/${key}.ggResp.dump`),
    }
  }

  get(req, reqBuffer) {
    const key = this._makeKey(req, reqBuffer)
    return this.storage[key]
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

// create server to gg server
const app = http.createServer( (gameReq, gameResp) => {
  console.time('gg-struggle api request')
  console.log(`[GAMEREQ] ${gameReq.url} ${gameReq.method}`)
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
  // check storage if request already parsed
  var gameReqBuffer = new SmartBuffer()

  gameReq.on('data', (d) => {
    gameReqBuffer.writeBuffer(d)
  })

  gameResp.on('finish', () => {
    console.timeEnd('gg-struggle api request')
  })
  gameResp.on('error', () => {
    console.timeEnd('gg-struggle api request')
  })

  gameReq.on('end', () => {
    let storage = getStorage()
    if (storage.contains(gameReq, gameReqBuffer)) {
      // return cached resp
      console.log(`Cache hit: ${gameReq.url} ${gameReq.method} ${gameReqBuffer.toBuffer()}`)
      let cachedResponse = storage.get(gameReq, gameReqBuffer)
      gameResp.headers = cachedResponse.headers
      gameResp.statusCode = cachedResponse.statusCode
      gameResp.end(cachedResponse.buffer.toBuffer())


    }

    else {

      console.log(`Cache miss: ${gameReq.url} ${gameReq.method} ${gameReqBuffer.toBuffer()}`)
      let storage = getStorage()
      let cachedResponse = storage.setWriteable(gameReq, gameReqBuffer)

      // create ggRequest
      const ggReq = https.request(options, (ggResp) => {
        console.debug(`Attempting to get ggResponse`)

        ggResp.on('data', d => {
          // when we get payload data from gg, write it to cache and back to game
          cachedResponse.buffer.writeBuffer(d)
          gameResp.write(d)
        })

        ggResp.on('end', e => {
          gameResp.headers = ggResp.headers
          gameResp.statusCode = ggResp.statusCode
          gameResp.end()

          cachedResponse.headers = ggResp.headers
          cachedResponse.statusCode = ggResp.statusCode
          console.debug(`Returned ${gameResp.statusCode}`)
        })

        ggResp.on('data', d => {
          ggRespFile.write(d)
        })

        ggResp.on('error', e => {
          console.error(`Error in response from gg servers: ${e}`)
        })
      })

      ggReq.on('error', (e) => {
        console.error(`Error making request to gg servers: ${e}`)
      })
      ggReq.on('connect', d => {
        console.log(`connected to gg servers`)
      })

      // set up logfiles
      const {
        gameReqFile,
        gameRespFile,
        ggReqFile,
        ggRespFile
      } = getStorage().createLogFiles(gameReq, gameReqBuffer)

      gameReqFile.write(gameReqBuffer.toBuffer())

      ggReq.on('data', d => {
        ggReqFile.write(d)
        console.log('ggReq written')
      })

      gameResp.on('data', (d) => {
        gameRespFile.write(d)
        console.log('gameResp written')
      })

      // send the ggReq
      ggReq.headers = gameReq.headers
      ggReq.statusCode = gameReq.statusCode
      ggReq.end(gameReqBuffer.toString())

    }

  })
})

app.listen(3000, () => {
  console.log(`Listening on ${port}`)
});
