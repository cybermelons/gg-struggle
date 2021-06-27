import https from 'https'
import axios from 'axios'
import qs from 'qs'

const ggServerPost = async ({ headers, body, slug, method }) => {
  const hostname = 'ggst-game.guiltygear.com'
  //const hostname = 'yeet.st'
  const options = {
    hostname: hostname,
    //port: 443,
    method: method,
    headers: {
      'user-agent': 'Steam',
      'accept': '*/*',
      'content-type': 'application/x-www-form-urlencoded',
      'connection': 'keep-alive',
    },
    data: qs.stringify(body)
  }
  console.log({options})

  const payload = new Promise((resolve, reject) => {

    // TODO log failed responses
    const url = `https://${options.hostname}/api/${slug.join('/')}`
    console.log(`getting response from ${url}`)
    axios(url, options)
    .then( (ggresp) => {
        console.log(`Response received from gg servers`)
        console.log({ggresp})

        resolve({ status: ggresp.status, headers: ggresp.headers, body: ggresp.data})
    })

    .catch((e) => {
      console.error(`Error sending request to gg server: ${e}`)
      reject({ status: 505, headers: {}, body: options})
    })
  })

  return payload;
}

export { ggServerPost }
