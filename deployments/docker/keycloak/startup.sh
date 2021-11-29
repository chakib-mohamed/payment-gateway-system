#!/bin/bash
echo "Creating keycloak-angular realms and clients in own process..."
/tmp/create-client.sh &> /dev/null & disown