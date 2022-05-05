# Issuer-Holder-Verifier App

## Overview

This is a prototype which implements a Self-Sovereign Identity application for issuing and verifying university student verifiable credentials and utilizes MATTR platform API's and Blockchain under the hood. 

MATTR is a Self-Sovereign Identity platform which provides a toolkit for creating digital identity solutions.

#### The application coconsists three main components: -

1. An Issuer single page application that can be integrated with existing University portal for issuing verifiable credentials to students.
2. A MATTR platform mobile wallet application for holding student credentials.
3. A demo Verifier single page application for mimicking a Liquor shop which asks students to share their credentials for age verification.

## Technologies used

The Issuer and Verifier are Single Page Applications and uses React.js on Frontend and an Express.js as Backend server for serving API requests. To ensure strong types on backend TypeScript has been used instead of JavaScript.

### Other important NPM packages used
* Bootstrap (For UI elements)
* Axios (For making API calls from frontend)
* GOT (For making API calls from backend to MATTR platform)
* NgRok (For exposing localhost as a public domain allowing interaction with mobile application)
* QrCode (to generate QR codes)

## Prerequisites
- You should have a MATTR mobile android application downloaded on your mobile. 

- You must have Node.js installed on your machine.

- For using MATTR platform you need to register with the platform and generated client secrets and keys but for ease of use, the default client secrets are provided in .env files. However, you can generate your own secrets and replace them in .env files of Issuer and Verifier applications.

```bash
Login Id - amanj@gmail.com
Password - Password@7

TENANT=aman-jain-ytlnpp.vii.mattr.global
ISSUER_DID=did:key:z6MkexYNQj1tUroogTCHNb5m8fRHHmf4xdkZjndWqyEVHaFo
CLIENT_ID=2dfOHDyGrROGMdzRS0LH327U1NhM54vc
CLIENT_SECRET=fugTCFx8awychE0FrkqhjRrf_rEJpuiXxBDOnOXguplyWFp7TXlkPXN-fKzgBcAQ
AUDIENCE=https://vii.mattr.global
GRANT_TYPE=client_credentials
```

## Application Structure
Both Issuer and Verifier app have React client applications under the Issuer/client and Verifier/client folders and express.js app code implemented in src/app.ts file under respective directories. 

## Installation

Use the npm or yarn package manager to install package dependencies for Issuer and Verifier applications individually.

```bash
npm install
yarn install
```

## Setup

```javascript

Start the backend servers for Issuer and Verifier app by going into the respective directories and then typing below commands

npm start or yarn start 

After that start your front end application using the same above commands by visiting into Issuer/client and Verifier/client directories

## Contributors
Aman Jain and Tanvi Garg