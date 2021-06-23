const https = require('https')


const ggServerPost = async ({ headers, body, slug, method }) => {
  const options = {
    hostname: 'yeet.st',
    port: 443,
    method: method,
    path: `api/${slug.join('/')}`
  }

  console.log(`pinging ggst`)

  const payload = new Promise((resolve, reject) => {
    // TODO log failed responses

    const req = https.request(options, (res) => {
      console.log(`Setting up req to gg server`)

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

    req.setHeader('user-agent', 'Steam')
    req.end()
  })

  return payload;
}

export { ggServerPost }
