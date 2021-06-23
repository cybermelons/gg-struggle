import { ggServerPost } from '../../utils/gg-server.js'
var hash = require('object-hash')


class PayloadStore {
  constructor(props) {
    this.storage = {}
  }

  contains({slug, method, body}) {
    const key = hash({slug, method, body})
    return (key in this.storage)
  }

  get({slug, method, body}) {
    const key = hash({slug, method, body})
    return this.storage[key]
  }

  set(queryObj, payload) {
    const { slug, method, body } = queryObj
    const key = hash({slug, method, body})
    this.storage[key] = payload;
  }
}

var PAYLOAD_STORE = new PayloadStore()
var getStorage = () => {
  return PAYLOAD_STORE
}

export default async (req, res) => {
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
  const query = {slug: req.query.slug, method: req.method, headers: req.headers, body: req.body}

  console.log({query})
  if (storage.contains(query)) {
    payload = storage.get(query)
    const { slug, method, body } = query;
    console.log(`Cache hit: ${slug.join('/')} ${method} ${body.data}`)
  }
  else {
    // send query to gg's servers
    payload = await ggServerPost(query)
    console.log(`Storing response from gg server for ${query.slug.join('/')}`)
    storage.set(query, payload)
  }

  {
    const { status, body } = payload
    console.log({payload})
    console.log({storage})
    res.status(status)
    res.send(body)
  }
}

//var eventEmitter = new events.EventEmitter();
//eventEmitter.addListener('
