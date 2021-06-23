import { events } from 'events'

import { ggServerPost } from '../../utils/gg-server.js'

var PAYLOAD_STORE = {}
var getStorage = () => {
  return PAYLOAD_STORE
}

export default function handler(req, res) {
  // parrot the regular gg server for now

  if (req.method.toLowerCase() !== 'post') {
    // ignore non-posts
    console.log(`Got non-POST request: `)
    console.log({req})
    res.status(469)
    res.end(`Got non-POST request {req}`)
  }

  var storage = getStorage()
  var payload;
  const query = {slug: req.slug, method: req.method, headers: req.headers, body: req.body}
  if (query in storage) {
    payload = storage[query]
  }
  else {
    // send query to gg's servers
    payload = ggServerPost(query)
    storage[query] = payload
  }

  {
    const { status, body } = payload
    res.status(status)
    res.send(body)
    console.log({body})
  }
}

//var eventEmitter = new events.EventEmitter();
//eventEmitter.addListener('
