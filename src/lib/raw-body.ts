import type { NextApiRequest } from "next";

export const MAX_BODY_BYTES = 1_048_576;

export class PayloadTooLargeError extends Error {
  constructor() {
    super(`Request body exceeds ${MAX_BODY_BYTES} bytes.`);
    this.name = "PayloadTooLargeError";
  }
}

export function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let byteLength = 0;
    let settled = false;

    const cleanup = (): void => {
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
    };

    const onData = (chunk: Buffer): void => {
      byteLength += chunk.byteLength;

      if (byteLength > MAX_BODY_BYTES) {
        settled = true;
        cleanup();
        // Pause rather than destroy: `req` and `res` share one socket, so
        // tearing it down here would reset the connection before the caller
        // could send its 413. The caller destroys it once that has flushed.
        req.pause();
        reject(new PayloadTooLargeError());

        return;
      }

      chunks.push(chunk);
    };

    const onEnd = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      // Decode once over the whole body. Decoding per chunk would mangle any
      // multi-byte character straddling a chunk boundary (~64KB) into U+FFFD —
      // silent corruption in a service whose contract is verbatim reflection.
      resolve(Buffer.concat(chunks).toString("utf8"));
    };

    const onError = (err: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    req.on("data", onData);
    req.on("end", onEnd);
    req.on("error", onError);
  });
}
