const assert = require('assert/strict');
const fs = require('fs-extra')
const path = require('path')
const process = require('process')
const readline = require("readline");
const tiged = require('tiged')

const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
});

const REPO = 'tsaibermelon/gg-struggle'
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

// Update gg-struggle relative to file 'update.js'
const ROOT = path.dirname(fs.realpathSync(process.argv[1]))

// sanity check: make sure root has update.js
assert(fs.existsSync(path.join(ROOT, 'update.js')))

rl.question(`Updating ${ROOT} with latest gg-struggle. This will overwrite
the entire ${ROOT} directory. Continue? [y/N] `, (answer) => {
  if (answer !== 'y') {
    console.log('Aborting...')
    process.exit()
  }

  const tmpdir = path.join(ROOT, 'tmp')
  console.log(tmpdir)

  console.log(`Cloning into ${tmpdir}`)
  console.log(`Updating ${tmpdir}`)
  emitter.clone(tmpdir).then(() => {
    console.info(`Successfully cloned into ${tmpdir}`)
    console.info(`Overwriting ${ROOT} with ${tmpdir}`)
    let files = fs.readdirSync(tmpdir)
    files.forEach((name) => {
      const oldpath = path.join(tmpdir, name)
      const newpath = path.join(ROOT, name)
      console.log(`Moving ${oldpath} -> ${newpath}`)
      fs.moveSync(oldpath, newpath, { 'overwrite': true } )
    })
    console.log(`gg-struggle updated to latest version`)
    process.exit()
  }).catch( (e) => {
    console.error(`couldn't update to ${ROOT}: ${e}`)
    console.error(`gg-struggle was NOT updated.`)
    process.exit(1)
  })

})

