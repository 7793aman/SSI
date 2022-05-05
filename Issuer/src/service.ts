import * as base64 from "@stablelib/base64";
import { RequestContext } from "./interfaces";
import qrcode from "qrcode";
const { v4: uuid } = require("uuid");
const base64UrlEncode = (str: string) => base64.encodeURLSafe(Buffer.from(str));

type item = { url: string; payload: string | undefined };
const shortenUrls = new Map<string, item>();

//functions

export async function createStudentVerificationRequest(
  ctx: RequestContext,
  uid: string,
  issuerDID: string,
) {
  const { api, ngrokUrl } = ctx;
  const didDoc = await api.get(`v1/dids/${issuerDID}`).json<Record<string, any>>();
  const didUrl = didDoc.didDocument?.authentication[0];
  const callbackUrl = `${ngrokUrl}/presentations/callback`;
  const templateId = await createPresentationTemplate(ctx, uid);

  //this is the main request which will generate a QR code for the student
  const { request } = await api
    .post("v1/presentations/requests", {
      json: { challenge: uid, did: issuerDID, templateId, callbackUrl },
    })
    .json();

  //signing the payload the send to the mobile app
  const signedRequest = await api
    .post("v1/messaging/sign", { json: { payload: request, didUrl } })
    .json<string>();

  //encoding request to be understand by mobile
  const result = await encodeDidRequest(ctx, signedRequest);
  return { ...result, jws: signedRequest };
}

export async function createPresentationTemplate(ctx: RequestContext, uid: string) {
  const { api } = ctx;
  const templateName = `presentation_request`;
  const domain = process.env.TENANT;
  const { id: templateId } = await api
    .post("v1/presentations/templates", {
      json: { domain, name: `${templateName}:${uid}`, query: [{ type: "DIDAuth" }] },
    })
    .json();
  return templateId;
}

export async function createCredential(
  ctx: RequestContext,
  subjectDid: string,
  issuerDid: string,
  input: {
    claimTypes: string[];
    claimContext: string[];
    claimContent: Record<string, unknown>;
  },
) {
  const { api } = ctx;
  const { claimTypes, claimContext, claimContent } = input;

  const credentialPayload = {
    "@context": ["https://www.w3.org/2018/credentials/v1", ...claimContext],
    type: ["VerifiableCredential", ...claimTypes],
    issuer: { id: issuerDid, name: "University SSI" },
    subjectId: subjectDid,
    claims: claimContent,
  };
  const { credential } = await api.post("v1/credentials", { json: credentialPayload }).json();
  return credential;
}

export async function createCredentialForStudentWallet(
  ctx: RequestContext,
  subjectDid: string,
  issuerDID: string,
  credential: Record<string, unknown>,
) {
  const { api } = ctx;

  const issuer = await api.get(`v1/dids/${issuerDID}`).json<Record<string, any>>();
  const issuerDidUrl = issuer.localMetadata?.initialDidDocument?.keyAgreement[0]?.id;

  const domain = process.env.TENANT;

  const messagePayload = {
    senderDidUrl: issuerDidUrl,
    recipientDidUrls: [subjectDid],
    payload: {
      id: uuid(),
      to: [subjectDid],
      from: issuerDID,
      type: "https://mattr.global/schemas/verifiable-credential/offer/Direct",
      created_time: Date.now(),
      body: { domain, credentials: [credential] },
    },
  };
  const { jwe } = await api.post("v1/messaging/encrypt", { json: messagePayload }).json();
  const result = await encodeDidRequest(ctx, jwe as object);
  return { ...result, jwe };
}

export async function pushNotificationWallet(
  ctx: RequestContext,
  subjectDid: string,
  message: object,
) {
  const { api } = ctx;
  const payload = { to: subjectDid, message };
  return await api.post("v1/messaging/send", { json: payload }).json();
}

export function resolveShortenUrl(code: string): item | undefined {
  return shortenUrls.get(code);
}

export function createShortenUrl(context: RequestContext, data: string | object): string {
  const { tenant, ngrokUrl } = context;
  const code = uuid();
  const request = typeof data === "string" ? data : base64UrlEncode(JSON.stringify(data));

  if (typeof data === "object") {
    shortenUrls.set(code, { url: `https://${tenant}`, payload: request });
  } else {
    shortenUrls.set(code, { url: `https://${tenant}?request=${request}`, payload: "" });
  }
  return `${ngrokUrl}/resolve/${code}`;
}

export async function encodeDidRequest(ctx: RequestContext, data: string | object) {
  const { bundleId } = ctx;
  const url = createShortenUrl(ctx, data);
  const didcommurl = `didcomm://${url}`;
  return {
    qrcode: await qrcode.toString(didcommurl, { margin: 0, width: 270, type: "svg" }),
    deeplink: `${bundleId}://accept/${Buffer.from(didcommurl).toString("base64")}`,
  };
}
