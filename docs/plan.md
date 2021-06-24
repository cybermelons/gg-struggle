Here's what I'll do. I'll take notes in a docs/ directory of whatever project
I'm working on (gg struggle in this case) and compile it as part of the project.

Notes outside of any one project can go in its own devlog repo.

# Plan

## **WIP** Problem

WIP
The GG server takes ~900ms to send each POST request. When there's 50+ on login
with barely any data returned, there's huge delays for trivial things.

So we're gonna implement a caching mitm server that returns data faster to the
client as long as its consistent. We'll also see how well the game handles
stale data.

## TODO

[ ] switch to expressjs for header-mirroring
[ ] Monitor client traffic with wireshark
[ ] Boot kali, run mitmdump between localhost and gg server
  - save keylogs to file
  - write output to another file
[ ] Point windows system proxy to mitmdump server
[ ] play gg
  [ ] launch gg
  [ ] struggle
  [ ] play opponent
[ ] save logs and keyfile
[ ] decrypt wireshark traffic with keyfile
[ ] map post request w/ data -> server response json payload
  - save as raw json file
[ ] create router to serve cached results from file (nextjs)
  [ ] hit real gg server for cache misses
[ ] create patch to use cache server (hosts file?)
  [ ] cert as well

## Testing

Each step of the way, we should write tests that fail first.
I'll write each test as script in an ordered list. Putting that in a bash file
with `-x` can suffice for now.

We will order our tests based on oldest request time first. We want to follow
the same order of requests the game goes through.

## Limitations

Theoretically, this works up to the point of joining lobbies. I don't have
enough data to understand how the payload works, which is why I'm still logging.
I suspect that for playing actual matches, the gg-server takes two players
requests to join a lobby id. On handshake with the gg-server, the players are
given each other's IPs to P2P game.

Other limitations we will run into like cache misses. Any feature unaccounted
for will have its own special log designation to implement as a test later.

We're also gonna find out how well GG handles stale data.

## Logging

On cache misses, we log the request data and store the unencrypted payload from the
server fetch. Logging the request time also helps organize the tests.

Since we do know we'll run into the P2P issues, we'll monitor and parse the pay
loads for IP addresses and network stuff.



Do an offsite static analysis of post data requests. Map the request to list of json strings.

## Bugs

If the game crashes or gives some server issue, we need to know what time that
happened and to who. Then we can check our logs for it.

If it doesn’t work, user needs to ping devs immediately. Canned data needs to be recached.

