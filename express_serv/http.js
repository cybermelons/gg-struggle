const https = require('https')
const http = require('http')

const port = 3000

const app = http.createServer( (gameReq, gameResp) => {
  console.log(`Got request from game`)
  // create server to gg server
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

    // send the game request to guilty gear
  const ggReq = https.request(options, (ggResp) => {
    console.log(`Attempting to get ggResponse`)

    ggResp.on('data', d => {
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
  .on('error', (e) => {
      console.error(`Error making request to gg servers: ${e}`)
  })
  .on('connect', d => {
    console.log(`connected to gg servers`)
  })
  console.log('Finished setting up gg req')

  gameReq.on('data', (d) => {
    ggReq.write(d)
  })
  gameReq.on('end', () => {
    ggReq.end()
  })
})

app.listen(3000, () => {
  console.log(`Listening on ${port}`)
});
