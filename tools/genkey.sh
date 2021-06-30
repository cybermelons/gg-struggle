#!/bin/bash

openssl genpkey -out ggstruggle.key -algorithm RSA -pkeyopt rsa_keygen_bits:4096
openssl req -new -key ggstruggle.key -out ggstruggle.pem
openssl x509 -req -days 365 -in ggstruggle.pem -signkey ggstruggle.key -out ggstruggle.cert
openssl pkcs12 -export -out ggwin.p12 -inkey ggstruggle.key -in ggstruggle.cert
