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

  _makeKey(req) {
    // hashing the request with
    //    method, url, body
    return hash({url, method, body})
  }

  get(req) {
    const key = _makeKey(req)
    return this.storage[key]
  }

  contains(req) {
    // TODO invalidate old requests
    return _makeKey(req) in this.storage
  }
}

// create server to gg server
const app = http.createServer( (gameReq, gameResp) => {
  console.log({gameReq})
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

  console.log('Finished setting up gg req')


  // check storage if request already parsed


  //const storage = getStorage()
  //if (storage.contains(gameReq)) {
  //  const cachedResp = storage.get(gameReq)
  //  gameResp.headers = cachedResp.headers
  //  gameResp.statusCode = cachedResp.statusCode
  //  gameResp.end(cachedResponse.data)
  //  return
  //}

  var gameReqBuffer = new SmartBuffer()

  gameReq.on('data', (d) => {
    gameReqBuffer.writeBuffer(d)
  })

  gameReq.on('end', () => {
    let storage = getStorage()
    if (storage.contains(gameReq, gameReqBuffer)) {
      // return cached resp
      console.log(`Cache hit: ${gameReq.url} ${gameReq.method} ${gameReqBuffer.toBuffer()}`)
      let cachedResp = storage.get(gameReq, gameReqBuffer)
      gameResp.headers = ggResp.headers
      gameResp.statusCode = ggResp.statusCode
      gameResp.end(gameReqBuffer.toBuffer())
    }

    else {
      let storage = getStorage()
      let cachedResponse = storage.setWriteable(gameReq, gameReqBuffer)

      // create ggRequest
      const ggReq = https.request(options, (ggResp) => {
        console.log(`Attempting to get ggResponse`)

        ggResp.on('data', d => {
          // when we get payload data from gg, write it to cache and back to game
          cachedResponse.write(d)
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

    app.listen(3000, () => {
      console.log(`Listening on ${port}`)
    });
