# Description

This project provides a simplified Payment Gateway System which process payment requests emanating from a Merchant with a basic 3D secure workflow handling.

It is worth noting that, while built with security constraints in mind, in no way this project could be a production ready payment gatway nor a server directory system given it is not PCI compliant.

The purpose is to provide a full NestJs example while covering commons technical challenges: Orm, security (authentication/rbac/Rate limiting), configuration, Rest/GraphQL Apis, payload validation, testing, OpenApi Doc, Liquibase.

The project is based on two modules:

- payment-gateway-system, which provides :

  - Rest/GraphQL Mutation Apis to Create/Apdate a Client (Merchant).
  - Rest/GraphQL Query Apis to get Client by its uuid.
  - Rest APi to Create a Pos (Point of Sale), related to a Client.
  - Rest Api to Process Payment Requests.
  - GraphQL Subscription Api to listen to the processed Payments state.

- Issuing-bank : Simple module with in memory DB whose goal is to handle 3DS workflow and authorize payments.

## Functionnalities

When processing a payment the systme ensures that :

- The Card Number is valid and not expired.
- The Pos is valid and related to the authenticated merchant.
- The Card's type (VISA, MASTERCARD ...) is supported for the authenticated Merchant.
- The given amount dosen't exceeds the threshold permitted for the merchant.

When the payment request is valid, the system inits a 3D secure authentication request to the issuing bank. Otherwise it emits an authorization request to the issuing bank.

## Framework/technologies used

- Sequelize for ORM.
- Passport to handle authentication/authorization with two strategies : 'merchant' (to authorize merchants) and 'internal' (to authorize internal users), more details on the security chapter.
- Open APi and Swagger UI.
- GraphQL.
- Class-validator to validate requests inputs.
- Liquibase

# Installation And Running the Apps

## Locally

For each module :

```bash
# Istall dependencies
$ npm install

# Running the app in dev mode :
$ npm run start:dev

# Running the app in prod mode :
$ npm run start:prod
```

## Via docker-compose :

From the <i>deployments/docker</i> folder run :

```bash
$ docker-compose up -d --build && docker-compose logs -f
```

## Run System Tests

From the payment-gateway-system module run :

```bash
# e2e tests
$ npm run test:st

# test coverage
$ npm run test:st:cov
```

## Configuration

Conf properties are provided through the vars env file <b><i>.env.$ENV</i></b>, where $ENV is the node ENV variable if given.

A conf file could be loaded from another location by providing the $CONF_PATH node variable :

```bash
$ CONF_PATH=/some/path node dist/main
```

## Swagegr UI / GraphQL playground Urls

- <b><i>http://localhost:3000/api/#/ </i></b> (Swagger UI must be enabled with the <b>SWAGGER_UI_ENABLE</b> conf variable)
- <b><i>http://localhost:3000/graphql</i></b>

(host and port vary depending on the configuration)

# Docker

The Docker configuration is located at <b><i>./deployments/docker</i></b> folder.

The build of the postgres image is provissionned with a <b><i>initdb.sql</i></b> file which creates the DBs and users for the Payment Gateway System Module and Keycloak.

The build of the Keycloak image uses the <b><i>create-client.sh</i></b> script which uses the keycloak CLI to :

- create two realms :
  - payment-gs-merchants : used to authenticate Merchants through a Client Credentials Grant.
  - payment-gs-internal : used to authenticate the internal users. (in order to authorize the GraphQL Subscription endpoint).
- Create a <i>**merchant-1**</i> client within the <i>**payment-gs-merchants**</i> realm.
- Create the <i>admin</i> user with an <i>admin</i> role within the <i>payment-gs-internal</i> realm.

# Security

## Rate limiting

A throttling startegy is applied on the payment processing endpoint to limit the max possible transactions for the same PAN to 5 withing a minute window. <br>
Those values are configured on .env file through the variables : <b>THROTTLE_TTL</b> and <b>THROTTLE_LIMIT</b>

## Access Token

To Call the Rest Apis, the request must contain a valid jwt Authorization Bearer Token which can be get by calling the keycloak POST endpoint : http://localhost:8181/auth/realms/payment-gs-merchants/protocol/openid-connect/token , with the following form url encoded parameters :

- client_id : merchant-1
- client_secret : ${client_secret}
- grant_type : client_credentials

where client_secret is the merchant-1's generated secret (located at client's credential tab conf in the keycloak admin console).

To call the GraphQL subscription Api (see payments.resolver.ts), get a valid access token by calling the POST endpoint : http://localhost:8181/auth/realms/payment-gs-internal/protocol/openid-connect/token , with the following params :

- client_id : payment-gs
- client_secret : ${client_secret}
- grant_type : password
- username : admin
- password : admin

(host and port vary depending on the configuration)
