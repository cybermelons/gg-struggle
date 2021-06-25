const https = require('https')
const http = require('http')
const hash = require('object-hash')
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
    this.storage[key] = new SmartBuffer()
    return this.storage[key]
  }

  _makeKey(req, reqBuffer) {
    // hashing the request with
    //    method, url, body
    const {url, method} = req
    const body = reqBuffer.readString()
    return hash({url, method, body})
  }

  get(req, reqBuffer) {
    const key = this._makeKey(req, reqBuffer)
    return this.storage[key]
  }

  contains(req, reqBuffer) {
    // TODO invalidate old requests
    return this._makeKey(req, reqBuffer) in this.storage
  }
}
var CACHE_LAYER = new CacheLayer()

function getStorage() {
  return CACHE_LAYER
}

// create server to gg server
const app = http.createServer( (gameReq, gameResp) => {
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

  gameReq.on('end', () => {
    let storage = getStorage()
    if (storage.contains(gameReq, gameReqBuffer)) {
      // return cached resp
      console.log(`Cache hit: ${gameReq.url} ${gameReq.method} ${gameReqBuffer.toBuffer()}`)
      gameResp.headers = ggResp.headers
      gameResp.statusCode = ggResp.statusCode
      gameResp.end(gameReqBuffer.toBuffer())
    }

    else {
      console.log(`Cache miss: ${gameReq.url} ${gameReq.method} ${gameReqBuffer.toBuffer()}`)
      let storage = getStorage()
      let cachedResponse = storage.setWriteable(gameReq, gameReqBuffer)

      // create ggRequest
      const ggReq = https.request(options, (ggResp) => {
        console.log(`Attempting to get ggResponse`)

        ggResp.on('data', d => {
          // when we get payload data from gg, write it to cache and back to game
          cachedResponse.writeBuffer(d)
          gameResp.write(d)
        })

        ggResp.on('end', e => {
          console.log(`Successfully got response from gg`)
          gameResp.headers = ggResp.headers
          gameResp.statusCode = ggResp.statusCode
          gameResp.end()
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

      // send the ggReq
      ggReq.headers = gameReq.headers
      ggReq.statusCode = gameReq.statusCode
      ggReq.end(gameReqBuffer.toBuffer())
    }

  })
})

app.listen(3000, () => {
  console.log(`Listening on ${port}`)
});
