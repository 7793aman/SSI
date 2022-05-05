require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const ngrok = require("ngrok");

app.use(cors());
app.use(router);
app.use(bodyParser.json());
app.use(cors());
app.use(router);

let ngrokUrl: string;
let jwsUrl: string;
let qrcode: any;
let age: string;

app.get("/qr", function (req: any, res: any) {
  const body = res.body;
  console.log(jwsUrl);
  res.redirect(jwsUrl);
});

app.listen(2000, function (err: any) {
  if (err) {
    throw err;
  }
  console.log("\n", "Server started on port 2000", "\n");
});

app.get("/qrcode", function (req: any, res: any) {
  res.send(qrcode);
});

app.get("/getage", function (req: any, res: any) {
  res.send({ age });
});

(async function () {
  let got = require("got");
  let response: any;
  let tenant = process.env.TENANT;

  const tokenBody = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    audience: process.env.AUDIENCE,
    grant_type: process.env.GRANT_TYPE,
  };
  console.log(tokenBody);

  const { access_token } = await got
    .post("https://auth.mattr.global/oauth/token", { json: tokenBody })
    .json();
  const token = access_token;

  ngrokUrl = await ngrok.connect(2000);

  const header: any = {
    Authorization: `Bearer ${token}`,
  };

  response = await got.post(`https://${tenant}/core/v1/presentations/requests`, {
    headers: header,
    json: {
      challenge: "GW8FGpP6jhFrl37yQZIM6w",
      did: process.env.VERIFIERDID,
      templateId: process.env.TEMPLATEID,
      callbackUrl: `${ngrokUrl}/callback`,
    },
    responseType: "json",
  });

  const requestPayload = response.body.request;

  // Get DIDUrl from Verifier DID Doc
  response = await got.get(`https://${tenant}/core/v1/dids/` + process.env.VERIFIERDID, {
    headers: header,
    responseType: "json",
  });
  const didUrl = response.body.didDocument.authentication[0];

  // Sign payload
  response = await got.post(`https://${tenant}/core/v1/messaging/sign`, {
    headers: header,
    json: {
      didUrl: didUrl,
      payload: requestPayload,
    },
    responseType: "json",
  });

  const jws = response.body;
  jwsUrl = `https://${tenant}/?request=${jws}`;

  let didcommUrl = `didcomm://${ngrokUrl}/qr`;
  // generate a QR Code using the didcomm url
  let QRCode = require("qrcode");
  QRCode.toString(didcommUrl, { type: "svg" }, function (err: any, url: any) {
    qrcode = url;
  });

  app.post("/callback", function (req: any, res: any) {
    const body = req.body;
    res.sendStatus(200);
    console.log(body);
    age = body.claims["http://schema.org/Age"];
  });
})();
