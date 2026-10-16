import { describe, expect, it } from "vitest";
import { AccessTokenCodec } from "@/infrastructure/security/jwt/AccessTokenCodec";

const settings = { secret: "x".repeat(48), issuer: "perfumeria-prestige", audience: "prestige-admin", ttlSeconds: 900 };

describe("AccessTokenCodec (JWT)", () => {
  it("firma y verifica un token válido", async () => {
    const codec = new AccessTokenCodec(settings);
    const { token } = await codec.sign({ userId: "u1", email: "a@p.co", role: "ADMIN", sessionId: "s1" });
    expect(await codec.verify(token)).toEqual({ userId: "u1", email: "a@p.co", role: "ADMIN", sessionId: "s1" });
  });

  it("rechaza tokens vencidos", async () => {
    const codec = new AccessTokenCodec(settings);
    const { token } = await codec.sign({ userId: "u1", email: "a@p.co", role: "ADMIN", sessionId: "s1" }, new Date(Date.now() - 3600_000));
    expect(await codec.verify(token)).toBeNull();
  });

  it("rechaza tokens firmados con otra clave o para otra audiencia", async () => {
    const { token } = await new AccessTokenCodec({ ...settings, secret: "y".repeat(48) }).sign({ userId: "u1", email: "a@p.co", role: "ADMIN", sessionId: "s1" });
    expect(await new AccessTokenCodec(settings).verify(token)).toBeNull();
    const other = await new AccessTokenCodec({ ...settings, audience: "otra-app" }).sign({ userId: "u1", email: "a@p.co", role: "ADMIN", sessionId: "s1" });
    expect(await new AccessTokenCodec(settings).verify(other.token)).toBeNull();
  });

  it("rechaza tokens alterados (por ejemplo, para subir de rol)", async () => {
    const codec = new AccessTokenCodec(settings);
    const { token } = await codec.sign({ userId: "u1", email: "a@p.co", role: "ASESOR", sessionId: "s1" });
    const [header, payload, signature] = token.split(".");
    const forged = JSON.parse(Buffer.from(payload!, "base64url").toString());
    forged.role = "ADMIN";
    const tampered = `${header}.${Buffer.from(JSON.stringify(forged)).toString("base64url")}.${signature}`;
    expect(await codec.verify(tampered)).toBeNull();
  });
});
