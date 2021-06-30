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
