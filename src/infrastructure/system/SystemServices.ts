import { randomInt, randomUUID } from "node:crypto";
import type { Clock, IdGenerator } from "@/core/application/ports/services";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class CryptoIdGenerator implements IdGenerator {
  /** Sin 0/O ni 1/I para que las referencias se lean bien por teléfono. */
  private static readonly ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

  uuid(): string {
    return randomUUID();
  }

  shortCode(length: number): string {
    let out = "";
    for (let i = 0; i < length; i++) out += CryptoIdGenerator.ALPHABET[randomInt(CryptoIdGenerator.ALPHABET.length)];
    return out;
  }
}
