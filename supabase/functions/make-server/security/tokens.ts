import { db } from "../db.tsx";

const TOKEN_PREFIX = "sha256:";

const toBase64Url = (bytes: Uint8Array) => {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const createSessionToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
};

export const hashSessionToken = async (token: string) => {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `${TOKEN_PREFIX}${toBase64Url(new Uint8Array(digest))}`;
};

export const findTokenRecord = async (token: string) => {
  const hashedToken = await hashSessionToken(token);
  const { data: hashedData, error: hashedError } = await db
    .from("auth_tokens")
    .select("user_id, expires_at, token")
    .eq("token", hashedToken)
    .single();

  if (hashedData && !hashedError) {
    return { data: hashedData, error: null };
  }

  // Transitional support for tokens issued before hashing was introduced.
  const { data: legacyData, error: legacyError } = await db
    .from("auth_tokens")
    .select("user_id, expires_at, token")
    .eq("token", token)
    .single();

  if (legacyData && !legacyError) {
    await db
      .from("auth_tokens")
      .update({ token: hashedToken })
      .eq("token", token);
    return { data: { ...legacyData, token: hashedToken }, error: null };
  }

  return { data: null, error: legacyError || hashedError };
};

export const deleteTokenRecord = async (token: string) => {
  const hashedToken = await hashSessionToken(token);
  await db
    .from("auth_tokens")
    .delete()
    .in("token", [hashedToken, token]);
};
