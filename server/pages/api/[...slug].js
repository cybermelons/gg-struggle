import { ggServerPost } from '../../utils/gg-server.js'
import utf8 from 'utf8'
import hash from 'object-hash'


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

  getAll() {
    return this.storage
  }
}

var PAYLOAD_STORE = new PayloadStore()
var getStorage = () => {
  return PAYLOAD_STORE
}

export default async (req, res) => {
  console.time('gg-struggle api request')

  // parrot the regular gg server for now
  if (req.method.toLowerCase() !== 'post') {
    // ignore non-posts
    console.log(`Got non-POST request: `)
    console.log({req})
    res.status(469)
    res.end(`Got non-POST request {req}`)
  }

  console.log(req.body.data)

  var storage = getStorage()
  var payload;
  const query = {slug: req.query.slug, method: req.method, headers: req.headers, body: req.body}

  if (query.slug[0] === 'getStorage') {
    console.log('storage')
    console.log(req.body)
    res.json(storage.getAll())
  }

  console.log(`[Inc. Request] ${query.slug.join('/')} ${query.method} ${query.body.data}`)
  console.log(query.headers)
  if (storage.contains(query)) {
    const { slug, method, body } = query;
    console.log(`Cache hit: ${slug.join('/')} ${method} ${body.data}`)

    payload = storage.get(query)
  }
  else {
    // send query to gg's servers
    payload = await ggServerPost(query)
    console.log(`Storing response from gg server for api/${query.slug.join('/')}`)
    //console.log({payload})
    storage.set(query, payload)
  }

  {
    const { status, body } = payload
    const stringBody = body
    res.status(status)
    res.send(stringBody)
    console.timeEnd('gg-struggle api request')
  }
}

