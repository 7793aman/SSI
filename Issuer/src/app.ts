import * as service from "./service";
import { RequestContext, Presentation } from "./interfaces";

const express = require("express");
const cors = require("cors");
const router = express.Router();
const ngrok = require("ngrok");
const dotenv = require("dotenv");
const got = require("got");
const { v4: uuid } = require("uuid");
const receivedPresentations = new Map<string, Presentation>();

//This information can be fetched from databse for an individual
const defaultClaims = {
  context: ["https://schema.org"],
  types: ["International Proof"],
  claims: {
    givenName: "Tanvi",
    familyName: "Garg",
    Age: "22",
    University: "Virginia Tech",
    Program: "Master's in Computer Science",
  },
};

router.post("/login", express.json(), async (req: any, res: any, next: any) => {
  try {
    const name = req.name;
    const password = req.password;

    if (name === "amanj@gmail.com" && password === "Password@7") res.sendStatus(200);
    else {
      res.send({});
    }
  } catch (err) {
    next(err);
  }
});

// Student can login and scan this QR code and when they accept this QR code
//A verification request is sent to student to confirm that its coming from University
//After that when student verifies it university can be assured its gonna issue
//credentials to a legitimate student.
router.post("/presentations/request", express.json(), async (req: any, res: any, next: any) => {
  try {
    const uid = uuid();
    const issuerDID: any = process.env.ISSUER_DID;
    const data = await service.createStudentVerificationRequest(req.context, uid, issuerDID);
    res.send({ uid, ...data });
  } catch (err: any) {
    next(err);
  }
});

router.post("/presentations/callback", express.json(), async (req: any, res: any, next: any) => {
  console.log("Received DIDAuth Presentation", req.body);
  const { challengeId, verified, holder } = req.body;
  if (!verified || !holder) {
    console.error("DID authentication request failed");
  } else {
    receivedPresentations.set(challengeId, { subjectDid: holder });
  }
  res.sendStatus(200);
});

router.get("/presentations/:uid/response", async (req: any, res: any) => {
  const { uid } = req.params;
  res.send({ data: receivedPresentations.get(uid) });
});

router.post("/credentials/issue", express.json(), async (req: any, res: any, next: any) => {
  try {
    const { context } = req;
    const { subjectDid } = req.body;
    console.log("subjectDid", subjectDid);
    const issuerDID: any = process.env.ISSUER_DID;
    const messagingDid: any = process.env.ISSUER_DID;
    const input: {
      claimTypes: string[];
      claimContext: string[];
      claimContent: Record<string, unknown>;
    } = {
      claimTypes: ["Age"],
      claimContext: ["https://schema.org"],
      claimContent: {
        Age: "28",
        Issuer: "Virginia Tech",
        CredentialAwarded: "Age Credential",
      },
    };
    const credential = await service.createCredential(context, subjectDid, issuerDID, input);
    const walletcredential = await service.createCredentialForStudentWallet(
      context,
      subjectDid,
      messagingDid,
      credential,
    );
    res.send(walletcredential);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/messaging/send",
  express.json({ limit: "3mb" }),
  async (req: any, res: any, next: any) => {
    try {
      const { subjectDid, message } = req.body;
      res.send(await service.pushNotificationWallet(req.context, subjectDid, message));
    } catch (err) {
      next(err);
    }
  },
);

router.get("/resolve/:code", async (req: any, res: any, next: any) => {
  const { code } = req.params;
  const found = service.resolveShortenUrl(code);
  if (found && found.payload) {
    return res.json(found.payload);
  }
  if (found) {
    return res.redirect(found.url);
  }
  next("No shorten URL found");
});

// Start the Express server
(async function bootstrap() {
  dotenv.config();

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
  const port = process.env.PORT || "3000";
  const tenant: any = process.env.TENANT;
  const bundleId = process.env.WALLET_BUNDLE_ID;

  const context: RequestContext = {
    tenant,
    bundleId: bundleId || "global.mattr.wallet",
    ngrokUrl: process.env.NGROK_URL || (await ngrok.connect(parseInt(port))),
    api: got.extend({
      headers: { Authorization: `Bearer ${token}` },
      prefixUrl: `https://${tenant}`,
    }),
  };

  const app = express();
  app.use((req: any, _: any, next: any) => {
    req.context = context;
    next();
  });
  app.use(cors());
  app.use(router);

  app.listen(port, () => {
    console.log(`App Started`);
    console.log(`localhost: http://localhost:${port}`);
    console.log(`Ngrok tunnel: ${context.ngrokUrl}`);
  });
})().catch(err => {
  console.error("Some error happened while launching the app", err);
  process.exit(1);
});
