const https = require('https')
const https = require('axios')


const ggServerPost = async ({ headers, body, slug, method }) => {
  const options = {
    hostname: 'yeet.st',
    //hostname: 'ggst-game.guiltygear.com',
    port: 443,
    method: method,
    path: `api/${slug.join('/')}`,
    headers: {
      'user-agent': 'Steam',
      'content-type': 'application/x-www-form-urlencoded',
    }
  }

  console.log(`pinging ggst`)
  console.log({options})

  const payload = new Promise((resolve, reject) => {
    // TODO log failed responses

    const req = https.request(options, (res) => {
      console.log(`Setting up req to gg server`)
      console.log({res})

      res.on('data', d => {
        // return the body
        resolve({ status: res.statusCode, headers: {}, body: d})
      })
    })

    req.on('error', (e) => {
      console.error(`Request to gg server failed`);
      console.error(e)
      reject({ status: 505, headers: {}, body: options})
    })

    req.write(body.data)
    req.end()
  })

  return payload;
}

export { ggServerPost }
