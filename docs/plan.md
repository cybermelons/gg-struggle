# Plan

## **WIP** Problem

WIP
The GG server takes ~900ms to send each POST request. When there's 50+ on login
with barely any data returned, there's huge delays for trivial things.

So we're gonna implement a caching mitm server that returns data faster to the
client as long as its consistent. We'll also see how well the game handles
stale data.

## TODO

[ ] invalidate the cache after 1 day
[ ] on cache hits, refresh cache asynchronously
[x] deployment
[ ] ~~client patch to use different url (search resource files)~~
[ ] spoof get_env
[x] native https support (caddy)

[x] use nodejs https module
[ ] ~~switch to expressjs for header-mirroring~~
[x] Monitor client traffic with wireshark
[x] Boot kali, run mitmdump between localhost and gg server
  - save keylogs to file
  - write output to another file
[x] Point windows system proxy to mitmdump server
[x] play gg
  [x] launch gg
  [x] struggle
  [x] play opponent
[x] save logs and keyfile
[x] decrypt wireshark traffic with keyfile
[x] map post request w/ data -> server response json payload
  - save as raw json file
[x] create router to serve cached results from file (nextjs)
  [x] hit real gg server for cache misses
[x] create patch to use cache server (hosts file?)
  [x] cert as well

## Testing

Each step of the way, we should write tests that fail first.
I'll write each test as script in an ordered list. Putting that in a bash file
with `-x` can suffice for now.

We will order our tests based on oldest request time first. We want to follow
the same order of requests the game goes through.

## Cache Management

Right now, the cache is a map of raw requests to its payload.
Other than that

## Logging

On cache misses, we log the request data and store the unencrypted payload from the
server fetch. Logging the request time also helps organize the tests.

Since we do know we'll run into the P2P issues, we'll monitor and parse the pay
loads for IP addresses and network stuff.


Do an offsite static analysis of post data requests.
Map the request to list of json strings.

## Bugs



