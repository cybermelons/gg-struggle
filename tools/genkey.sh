#!/bin/bash

set -e

CA_CNF=$PWD/CA.cnf
SERVER_CNF=$PWD/localhost.cnf

# Generate a CA private key and Certificate (valid for 5 years)
mkdir -p certs
cd certs
#openssl req -nodes -new -x509 -keyout CA_key.pem -out CA_cert.pem -days 1825 -config $CA_CNF

# Generate web server secret key and CSR

openssl req -x509 -newkey rsa:4096 -keyout ggstruggle-key.pem -out ggstruggle-cert.pem -days 365 -config $SERVER_CNF

# generate key
#openssl genrsa -out ggstruggle-key.pem 2048

# With TLS/SSL, all servers (and some clients) must have a certificate. Certificates are public keys that correspond to a private key, and that are digitally signed either by a Certificate Authority or by the owner of the private key (such certificates are referred to as "self-signed"). The first step to obtaining a certificate is to create a Certificate Signing Request (CSR) file.

# The OpenSSL command-line interface can be used to generate a CSR for a private key:

#openssl req -new -sha256 -key ggstruggle-key.pem -out ggstruggle-csr.pem -config $SERVER_CNF

# Once the CSR file is generated, it can either be sent to a Certificate Authority for signing or used to generate a self-signed certificate.

# Creating a self-signed certificate using the OpenSSL command-line interface is illustrated in the example below:

#openssl x509 \
#  -req \
#  -in ggstruggle-csr.pem \
#  -signkey ggstruggle-key.pem \
#  -out ggstruggle-cert.pem \
#  -CA CA_cert.pem \
#  -CAkey CA_key.pem \
#  -CAcreateserial
