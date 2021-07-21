const tiged = require('tiged')
const path = require('path')
const process = require('process')

//const REPO = 'tsaibermelon/gg-struggle'
const REPO = 'https://git.yeet.st/tsaibermelon/gg-struggle'
const BRANCH = 'main'

const emitter = tiged(`${REPO}#${BRANCH}`, {
  cache: false,
  force: true,
  verbose: false,
})

emitter.on('info', info => {
  console.error(info.message);
})

emitter.on('error', e => {
  console.log(e.message);
})

//const progdir = path.basename(process.argv[1])
const progdir = '/tmp'

console.log(`Updating ${progdir}`)
emitter.clone(progdir).then(() => {
  console.info(`cloned to ${progdir}`)
  console.log(`gg-struggle updated to latest version`)
}).catch( (e) => {
  console.error(`couldn't clone to ${progdir}: ${e}`)
  console.error(`gg-struggle was NOT updated.`)
})
const tiged = require('tiged')
const path = require('path')
const process = require('process')

//const REPO = 'tsaibermelon/gg-struggle'
const REPO = 'https://git.yeet.st/tsaibermelon/gg-struggle'
const BRANCH = 'main'

const emitter = tiged(`${REPO}#${BRANCH}`, {
  cache: false,
  force: true,
  verbose: false,
})

emitter.on('info', info => {
  console.error(info.message);
})

emitter.on('error', e => {
  console.log(e.message);
})

//const progdir = path.basename(process.argv[1])
const progdir = '/tmp'

console.log(`Updating ${progdir}`)
emitter.clone(progdir).then(() => {
  console.info(`cloned to ${progdir}`)
  console.log(`gg-struggle updated to latest version`)
}).catch( (e) => {
  console.error(`couldn't clone to ${progdir}: ${e}`)
  console.error(`gg-struggle was NOT updated.`)
})
