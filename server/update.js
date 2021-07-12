//degit git@git.yeet.st:cybermelon/gg-struggle
const degit = require('degit');

const emitter = degit('tsaibermelon/gg-struggle', {
    cache: true,
    force: true,
    verbose: true,
});

emitter.on('info', info => {
    console.log(info.message);
});

emitter.clone('..').then(() => {
    console.log('done');
});
