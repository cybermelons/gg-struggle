#!/bin/bash

set -e

# Generate a CA private key and Certificate (valid for 5 years)
openssl req -nodes -new -x509 -keyout CA_key.pem -out CA_cert.pem -days 1825 -config CA.cnf

# Generate web server secret key and CSR
echo "Generating web server secret key and CSR"
openssl req -sha256 -nodes -newkey rsa:2048 -keyout localhost_key.pem -out localhost.csr -config localhost.cnf

# Create cert aqnd sign with CA
echo "Creasting cert and siginin with CA"
openssl x509 -req -days 398 -in localhost.csr -CA CA_cert.pem -CAkey CA_key.pem -CAcreateserial -out localhost_cert.pem -extensions req_ext -extfile localhost.cnf

openssl pkcs12 -export -out ggwin.p12 -inkey localhost_key.pem -in localhost_cert.pem

#openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# generate key
openssl genrsa -out ggstruggle-key.pem 2048

# With TLS/SSL, all servers (and some clients) must have a certificate. Certificates are public keys that correspond to a private key, and that are digitally signed either by a Certificate Authority or by the owner of the private key (such certificates are referred to as "self-signed"). The first step to obtaining a certificate is to create a Certificate Signing Request (CSR) file.

# The OpenSSL command-line interface can be used to generate a CSR for a private key:

openssl req -new -sha256 -key ggstruggle-key.pem -out ggstruggle-csr.pem

# Once the CSR file is generated, it can either be sent to a Certificate Authority for signing or used to generate a self-signed certificate.

# Creating a self-signed certificate using the OpenSSL command-line interface is illustrated in the example below:

openssl x509 -req -in ggstruggle-csr.pem -signkey ggstruggle-key.pem -out ggstruggle-cert.pem

# Once the certificate is generated, it can be used to generate a .pfx or .p12 file:

openssl pkcs12 -export -in ggstruggle-cert.pem -inkey ggstruggle-key.pem \
      -certfile ca-cert.pem -out ggwin.pfx
