#!/bin/bash
export PATH=$PATH:$JBOSS_HOME/bin

AUTH_ENDPOINT=http://localhost:8080/auth/
MERCHANTS_REALM=payment-gs-merchants	
INTERNAL_USERS_REALM=payment-gs-internal
MERCHANT_CLIENT_ID=merchant-1
ADMIN_CLIENT_ID=payment-gs
USER_NAME_AND_ROLE=admin

while ! curl -s --head  --request GET $AUTH_ENDPOINT | grep "200 OK" > /dev/null; do
  echo "Waiting for Keycloak server..."
  sleep 5s
done

kcadm.sh config credentials --server $AUTH_ENDPOINT --realm master --user $KEYCLOAK_USER --password $KEYCLOAK_PASSWORD
realm1=$(kcadm.sh get realms/$MERCHANTS_REALM)
if [ -z "$realm1" ]; then
    kcadm.sh create realms -s realm=$MERCHANTS_REALM -s enabled=true
else
    echo "The realm $MERCHANTS_REALM has already been created."
fi

realm2=$(kcadm.sh get realms/$INTERNAL_USERS_REALM)
if [ -z "$realm1" ]; then
    kcadm.sh create realms -s realm=$INTERNAL_USERS_REALM -s enabled=true
else
    echo "The realm $INTERNAL_USERS_REALM has already been created."
fi

## Create clients
    kcadm.sh create clients -r $MERCHANTS_REALM -s clientId=$MERCHANT_CLIENT_ID  -s 'redirectUris=["*"]' -s 'publicClient=false' -s 'serviceAccountsEnabled=true'
    kcadm.sh create clients -r $INTERNAL_USERS_REALM -s clientId=$ADMIN_CLIENT_ID -s 'redirectUris=["*"]' -s 'publicClient=false' -s 'directAccessGrantsEnabled=true'


## Create user and role

    kcadm.sh create users -r $INTERNAL_USERS_REALM -s username=$USER_NAME_AND_ROLE -s enabled=true
    kcadm.sh set-password -r $INTERNAL_USERS_REALM  --username $USER_NAME_AND_ROLE --new-password $USER_NAME_AND_ROLE

    kcadm.sh create roles -r $INTERNAL_USERS_REALM -s name=$USER_NAME_AND_ROLE
    kcadm.sh add-roles --uusername $USER_NAME_AND_ROLE --rolename $USER_NAME_AND_ROLE -r $INTERNAL_USERS_REALM


