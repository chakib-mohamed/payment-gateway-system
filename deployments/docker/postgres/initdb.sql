CREATE USER ps_user WITH CREATEDB PASSWORD 'ps_user';
CREATE USER keycloak WITH CREATEDB PASSWORD 'keycloak';
CREATE DATABASE payment_system OWNER ps_user;
CREATE DATABASE keycloak OWNER keycloak;

