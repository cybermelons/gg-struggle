Here's an explanation of gg-struggle as if it were a movie heist.

## Premise

Imagine we're trying to deliver and mail to and from some person who calls
themself "Sol". We use our GPS (DNS) to find which address "Sol" lives at: 555
Japan Drive. Now our car (game client) can drive directly to and from 555
Japan Drive to deliver a letter (HTTP request). With Japan Drive being very
far from a house in NA, each letter takes a long time to send and
receive (even at the speed of light).

Suppose we want to ask Sol a bunch of questions. We write _one_ question in a
letter, put it in our car, punch his name into GPS, and the car will drive itself
to Japan to ask the first question. Before sending the second one out, we
have to wait for the car to come back with Sol's letter in response.
Sending these one-by-one is awful if you have to go halfway across the globe
for each letter.

gg-struggle is a con to trick that car into thinking Sol lives at our house,
so it doesn't need to travel far.

## The Plan

We need to do three things for the game to believe us:

1. Navigate the car to our house
2. Prove our identity as "Sol"
3. Exchange authentic letters from Sol

### 1. Navigation

Our car (the game) is designed to only send/receive letters
addressed to "Sol". We can't change the "TO/FROM" postage on the letters,
but we can trick the GPS (DNS) to think he lives at your house (gg-struggle)
instead of a house in Japan.

We simply edit the hosts file with an override that Sol's house
is located at our (IP) address 127 Local Road, instead of 5-16 Japan Drive.

### 2. Identity

The car is now at our address on 127 Local Road, visiting our house
(gg-struggle), but is still skeptical. It needs to see ID (SSL cert)
issued by the authorities to prove that this really is Sol's house, and not
some con-artists claiming to be.

Well, we don't have Sol's ID. Even if we made our own (locally generated),
the car can't trust it because it's not signed by the authorities. It's
only signed by us (self-signed).

We simply tell (install) the car's operator (OS) that we are one of those
trusted authorities. Now if we present our ID to the car, it sees that we,
now a trusted authority, signed it and believes us.

Now when the car pulls up, it looks at our ID signed by us, now a trusted
authority. The car believes we're the real Sol and is willing to exchange
letters.

### 3. Authentic Letters (data)

The car now arrives at our house thinking we're the real Sol, willing to
exchange letters. It hands us a letter addressed to Sol, waiting for his response.

With no letters of our own respond with, we take theirs, copy it, throw it into
a separate car to Japan and wait for his real response. One roundtrip to Japan
later, we get his letter.

With the real letter, we make a copy and give one to the game-car and keep
(cache) one in our house. The car drives away happy with a real letter.

The next time the car comes with that exact same letter as before, we can
give out our stored copy immediately instead of making it wait. That copy
is a little old, but it's still usable to the game. And in the meantime, we're
sending a car out back to get an updated copy.

## Result

We build a fake house (gg-struggle) at our home address (127.0.0.1). We
override the game-car's GPS (DNS+hosts) to believe "Sol"
(`ggst-game.guiltygear.com`) lives at home instead of Japan. It drives 0
distance to our house looking for the real "Sol".

We make our own ID (self-signed cert) and tell the car's operator (OS) that we
can trust the signature. The car believes we are Sol and wants to exchange
letters.

The game car hands us a letter, waits for a response. In the back, we send a car
to get Sol's real response from Japan. Once we get it, we make a copy (cache)
and give it to the game-car.

Game-car drives away happy with a real response. The next time it comes back,
we can immediately hand back a copy with no wait.

The game gets valid (but slightly old) data instantly without needing travel
to Japan and back.

