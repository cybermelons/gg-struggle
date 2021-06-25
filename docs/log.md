# 06/23/2021

12:29pm
woke up and ate and ready to go.

last time we trying to convert the payload from hex to curl

now I have a parrot server working. now I need to point gg to it.

I can proxy it and set up a cert.
so if I changed the hosts file, then it'll point to GG, but there's gonna be a
SSL security error.  so we need to get the server to use the self-signed certs
that each client gets.

later on, we can just use a different domain with SSL enabled.

I found a problem: the binary payload from nextjs -> client gets messed up.
I need to switch from nextjs to a more raw router. I'll switch to expressjs


## 06/24/2021

instead of using expressjs, i'll more something more raw to get the exact
payload sent through. https.

