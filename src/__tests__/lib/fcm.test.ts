import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { generateKeyPairSync } from "node:crypto";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

function configure(): void {
  vi.stubEnv("FCM_PROJECT_ID", "test-project");
  vi.stubEnv("FCM_CLIENT_EMAIL", "svc@test.iam.gserviceaccount.com");
  vi.stubEnv("FCM_PRIVATE_KEY", privateKey);
}

interface Captured {
  url: string;
  body: string;
}

// Mock fetch for both hops. `onToken` shapes the OAuth2 response so individual
// tests can force a failed mint.
function stubFetch(
  captured: Captured[],
  onToken: (assertion: string) => Response,
  onSend: () => Response = () =>
    new Response(JSON.stringify({ name: "projects/p/messages/0:abc" }), {
      status: 200,
    }),
): void {
  vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
    // Every body this module sends is a string.
    const body = typeof init.body === "string" ? init.body : "";

    captured.push({ url, body });

    if (url.includes("oauth2")) {
      const assertion = new URLSearchParams(body).get("assertion") ?? "";

      return Promise.resolve(onToken(assertion));
    }

    return Promise.resolve(onSend());
  });
}

describe("fcm", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  // The regression this test exists for: Google's OAuth2 error response quotes
  // the JWT assertion back, and that assertion is signed with the
  // service-account key. It must never reach a thrown message or a log line.
  it("never leaks the JWT assertion when a token mint is rejected", async () => {
    configure();

    const captured: Captured[] = [];
    let assertionSent = "";

    stubFetch(captured, (assertion) => {
      assertionSent = assertion;

      // Shaped like a real Google rejection, which echoes the assertion.
      return new Response(
        JSON.stringify({
          error: "invalid_grant",
          error_description: `Invalid JWT: ${assertion}`,
        }),
        { status: 400 },
      );
    });

    const errors: unknown[] = [];
    const logs: unknown[] = [];

    vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => {
      errors.push(...a);
    });
    vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => {
      logs.push(...a);
    });
    vi.spyOn(console, "warn").mockImplementation((...a: unknown[]) => {
      logs.push(...a);
    });

    const { sendFcmNotification } = await import("@/lib/fcm");

    // Deliberately untyped: the point of this test is WHAT the message
    // contains, asserted below, not that it matches a shape.
    await expect(
      sendFcmNotification("device-token", "Title", "Body"),
    ).rejects.toThrow();

    expect(assertionSent).not.toBe("");

    // The signature segment alone is enough to be a credential disclosure.
    const signature = assertionSent.split(".")[2];

    let thrown = "";

    try {
      await sendFcmNotification("device-token", "Title", "Body");
    } catch (err) {
      thrown = err instanceof Error ? err.message : String(err);
    }

    expect(thrown).toContain("400");
    expect(thrown).not.toContain(assertionSent);
    expect(thrown).not.toContain(signature);
    expect(thrown).not.toContain("Invalid JWT");
    expect(thrown).not.toContain("invalid_grant");

    const everythingLogged = [...errors, ...logs].map(String).join("\n");

    expect(everythingLogged).not.toContain(assertionSent);
    expect(everythingLogged).not.toContain(signature);
  });

  it("does not leak the access token when the mint body is malformed", async () => {
    configure();

    stubFetch(
      [],
      () =>
        new Response('{"access_token":"ya29.SECRET-VALUE"', { status: 200 }),
    );

    const { sendFcmNotification } = await import("@/lib/fcm");

    let thrown = "";

    try {
      await sendFcmNotification("device-token", "Title", "Body");
    } catch (err) {
      thrown = err instanceof Error ? err.message : String(err);
    }

    expect(thrown).toContain("malformed");
    expect(thrown).not.toContain("ya29.SECRET-VALUE");
    expect(thrown).not.toContain("SECRET");
  });

  // All-or-nothing config gate: safe to ship before a Firebase project exists.
  it("is off, and does not throw, when no FCM env vars are set", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("FCM_PROJECT_ID", "");
    vi.stubEnv("FCM_CLIENT_EMAIL", "");
    vi.stubEnv("FCM_PRIVATE_KEY", "");

    const calls: Captured[] = [];

    stubFetch(calls, () => new Response("{}", { status: 200 }));

    const { sendFcmNotification, isFcmConfigured } = await import("@/lib/fcm");

    expect(isFcmConfigured()).toBe(false);
    await expect(
      sendFcmNotification("device-token", "Title", "Body"),
    ).resolves.toEqual({
      ok: false,
      statusCode: 0,
      error: "fcm_not_configured",
    });
    // Nothing was sent anywhere.
    expect(calls).toHaveLength(0);
  });

  it("builds a data-only message expo-notifications can read", async () => {
    configure();

    const captured: Captured[] = [];

    stubFetch(
      captured,
      () =>
        new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), {
          status: 200,
        }),
    );

    const { sendFcmNotification } = await import("@/lib/fcm");
    const res = await sendFcmNotification(
      "fcm-device-token",
      "Webhook",
      "POST request received",
      { type: "webhook_event", method: "POST", eventId: "evt_1" },
      { subtitle: "sub", badge: 3 },
    );

    const send = captured.find((c) => c.url.includes("fcm.googleapis.com"));

    expect(send).toBeDefined();

    const parsed = JSON.parse(send?.body ?? "{}") as {
      message: {
        token: string;
        data: Record<string, string>;
        android: Record<string, string>;
        notification?: unknown;
      };
    };

    // Data-only: no notification block in either position.
    expect(parsed.message.notification).toBeUndefined();
    expect(parsed.message.android.notification).toBeUndefined();
    expect(parsed.message.android.priority).toBe("HIGH");
    // Not FCM's four-week default.
    expect(parsed.message.android.ttl).toBe("3600s");
    expect(parsed.message.token).toBe("fcm-device-token");

    // FCM rejects the whole message if any data value is a non-string.
    for (const value of Object.values(parsed.message.data)) {
      expect(typeof value).toBe("string");
    }

    expect(parsed.message.data.channelId).toBe("default");

    // The client's first-priority read: content.data is JSON.parse(data.body).
    expect(JSON.parse(parsed.message.data.body ?? "{}")).toEqual({
      type: "webhook_event",
      method: "POST",
      eventId: "evt_1",
    });

    // The client's fallback read: trigger.remoteMessage.data, flat strings.
    expect(parsed.message.data.type).toBe("webhook_event");
    expect(parsed.message.data.title).toBe("Webhook");
    expect(parsed.message.data.message).toBe("POST request received");
    expect(parsed.message.data.badge).toBe("3");

    expect(res).toEqual({
      ok: true,
      messageId: "projects/p/messages/0:abc",
      statusCode: 200,
    });
  });

  it.each([
    [404, "UNREGISTERED"],
    [403, "SENDER_ID_MISMATCH"],
    [400, "INVALID_ARGUMENT"],
  ])("surfaces the FCM errorCode for %i", async (status, errorCode) => {
    configure();

    stubFetch(
      [],
      () =>
        new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), {
          status: 200,
        }),
      () =>
        new Response(
          JSON.stringify({
            error: {
              code: status,
              status: "ERROR",
              message: "long free-form text",
              details: [{ errorCode }],
            },
          }),
          { status },
        ),
    );

    const { sendFcmNotification } = await import("@/lib/fcm");
    const res = await sendFcmNotification("dead-token", "t", "b");

    expect(res).toEqual({ ok: false, statusCode: status, error: errorCode });
    // Free-form message text is deliberately not surfaced.
    expect(res.error).not.toContain("free-form");
  });

  it("reuses the cached access token across sends", async () => {
    configure();

    const captured: Captured[] = [];

    stubFetch(
      captured,
      () =>
        new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), {
          status: 200,
        }),
    );

    const { sendFcmNotification } = await import("@/lib/fcm");

    await sendFcmNotification("a", "t", "b");
    await sendFcmNotification("a", "t", "b");

    expect(captured.filter((c) => c.url.includes("oauth2"))).toHaveLength(1);
  });
});
