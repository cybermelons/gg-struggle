//degit git@git.yeet.st:cybermelon/gg-struggle
const degit = require('degit');

const emitter = degit('tsaibermelon/gg-struggle#main', {
    cache: true,
    force: true,
    verbose: true,
});

emitter.on('info', info => {
    console.error(info.message);
});

emitter.on('info', info => {
    console.log(info.message);
});

emitter.clone('tmp').then(() => {
    console.log('done');
});
