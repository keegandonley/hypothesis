export function encodeBasicAuth(username: string, password: string): string {
  return btoa(`${username}:${password}`);
}

export function decodeBasicAuth(
  input: string,
): { username: string; password: string } | null {
  try {
    const token = input.replace(/^Basic\s+/i, "").trim();

    if (!token) return null;
    const decoded = atob(token);
    const colonIdx = decoded.indexOf(":");

    if (colonIdx === -1) return { username: decoded, password: "" };

    return {
      username: decoded.slice(0, colonIdx),
      password: decoded.slice(colonIdx + 1),
    };
  } catch {
    return null;
  }
}
