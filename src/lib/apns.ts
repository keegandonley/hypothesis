import { createSign } from "node:crypto";
import { connect } from "node:http2";

const HOST_PROD = "https://api.push.apple.com";
const HOST_SANDBOX = "https://api.sandbox.push.apple.com";

function host(sandbox: boolean): string {
  return sandbox ? HOST_SANDBOX : HOST_PROD;
}

function generateJwt(): string {
  /* eslint-disable @typescript-eslint/no-non-null-assertion -- env vars validated by deployment */
  const keyId = process.env.APNS_KEY_ID!;
  const teamId = process.env.APNS_TEAM_ID!;
  const privateKey = process.env.APNS_KEY_P8!.replace(/\\n/g, "\n");
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  const header = Buffer.from(
    JSON.stringify({ alg: "ES256", kid: keyId }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }),
  ).toString("base64url");
  const signingInput = `${header}.${payload}`;

  const sign = createSign("SHA256");

  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(
    { key: privateKey, dsaEncoding: "ieee-p1363" },
    "base64url",
  );

  return `${signingInput}.${signature}`;
}

export interface ApnsResult {
  ok: boolean;
  apnsId?: string;
  statusCode: number;
  error?: string;
}

export interface ApnsOptions {
  subtitle?: string;
  sound?: string | null;
  badge?: number;
}

export function sendApnsNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: object,
  options?: ApnsOptions,
  sandbox: boolean = process.env.APNS_PRODUCTION !== "true",
): Promise<ApnsResult> {
  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- validated by deployment */
  const bundleId = process.env.APNS_BUNDLE_ID!;

  const alert: Record<string, string> = { title, body };

  if (options?.subtitle) alert.subtitle = options.subtitle;

  const aps: Record<string, unknown> = { alert };

  if (options?.sound !== null) aps.sound = options?.sound ?? "default";
  if (options?.badge !== undefined) aps.badge = options.badge;

  const payloadStr = JSON.stringify({
    aps,
    ...(data ?? {}),
  });

  const jwt = generateJwt();

  console.log("[apns] sending notification", {
    deviceToken: `${deviceToken.slice(0, 8)}…`,
    payload: JSON.parse(payloadStr) as Record<string, unknown>,
  });

  return new Promise((resolve, reject) => {
    const client = connect(host(sandbox));

    client.on("error", (err) => {
      client.destroy();
      reject(err);
    });

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "content-type": "application/json",
      "content-length": Buffer.byteLength(payloadStr),
    });

    req.write(payloadStr);
    req.end();

    req.on("response", (headers: Record<string, string | undefined>) => {
      const statusCode = Number(headers[":status"]) || 0;
      const apnsId = headers["apns-id"];

      let responseBody = "";

      req.setEncoding("utf8");
      req.on("data", (chunk: string) => {
        responseBody += chunk;
      });
      req.on("end", () => {
        client.close();
        if (statusCode === 200) {
          resolve({ ok: true, apnsId, statusCode });
        } else {
          let error: string | undefined;

          try {
            error = (JSON.parse(responseBody) as { reason?: string }).reason;
          } catch {
            error = responseBody || `APNs error ${statusCode}`;
          }

          resolve({ ok: false, statusCode, error, apnsId });
        }
      });
    });

    req.on("error", (err: Error) => {
      client.destroy();
      reject(err);
    });
  });
}
