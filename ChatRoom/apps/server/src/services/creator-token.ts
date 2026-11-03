
import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export function generateCreatorToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashCreatorToken(token: string): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

export function verifyCreatorToken(
  token: string,
  storedHash: string,
): boolean {
  if (
    typeof token !== "string" ||
    typeof storedHash !== "string"
  ) {
    return false;
  }

  const candidateHash = Buffer.from(
    hashCreatorToken(token),
    "hex",
  );

  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const expectedHash = Buffer.from(
    storedHash,
    "hex",
  );

  return timingSafeEqual(
    candidateHash,
    expectedHash,
  );
}
