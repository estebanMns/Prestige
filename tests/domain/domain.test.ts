import { describe, expect, it } from "vitest";
import { Order } from "@/core/domain/order/Order";
import { ValidationError } from "@/core/domain/shared/DomainError";
import { Money } from "@/core/domain/shared/Money";
import { PhoneNumber } from "@/core/domain/shared/PhoneNumber";
import { Slug } from "@/core/domain/shared/Slug";
import { Permission, RolePolicy } from "@/core/domain/user/Role";
import { StoreSettings } from "@/core/domain/settings/StoreSettings";
import { draft, perfume, user } from "../fakes/builders";

describe("Money", () => {
  it("suma, multiplica y formatea en pesos colombianos", () => {
    const total = Money.cop(620000).multiply(2).add(Money.cop(160000));
    expect(total.amount).toBe(1_400_000);
    expect(total.format()).toMatch(/1\.400\.000/);
  });

  it("rechaza montos negativos o con decimales", () => {
    expect(() => Money.cop(-1)).toThrow(ValidationError);
    expect(() => Money.cop(10.5)).toThrow(ValidationError);
  });
});

describe("Perfume", () => {
  it("ordena las presentaciones y calcula el precio inicial", () => {
    const p = perfume();
    expect(p.presentations.map((v) => v.ml)).toEqual([60, 100, 100]);
    expect(p.startingPrice().amount).toBe(160000);
  });

  it("exige al menos una presentación", () => {
    expect(() => perfume(undefined, { presentations: [] })).toThrow(/al menos una presentación/);
  });

  it("no permite presentaciones repetidas con los mismos ml y tipo", () => {
    const repeated = draft().presentations.concat({ ml: 100, type: "ORIGINAL", priceCop: 1 });
    expect(() => perfume(undefined, { presentations: repeated })).toThrow(/repetidas/);
  });

  it("un perfume unisex sirve para hombre y para mujer", () => {
    const p = perfume(undefined, { gender: "UNISEX" });
    expect(p.isSuitableFor("HOMBRE")).toBe(true);
    expect(p.isSuitableFor("MUJER")).toBe(true);
  });

  it("rechaza valores fuera de los catálogos", () => {
    expect(() => perfume(undefined, { category: "OTRA" })).toThrow(ValidationError);
  });
});

describe("User", () => {
  it("se bloquea al alcanzar el máximo de intentos fallidos", () => {
    const u = user();
    const now = new Date("2026-10-15T12:00:00Z");
    const policy = { maxAttempts: 3, lockMinutes: 15 };
    u.registerFailedLogin(now, policy);
    u.registerFailedLogin(now, policy);
    expect(u.isLocked(now)).toBe(false);
    u.registerFailedLogin(now, policy);
    expect(u.isLocked(now)).toBe(true);
    expect(u.isLocked(new Date(now.getTime() + 16 * 60_000))).toBe(false);
  });
});

describe("RolePolicy", () => {
  it("el asesor sube y edita perfumes pero no borra ni cambia ajustes", () => {
    expect(RolePolicy.allows("ASESOR", Permission.PerfumeCreate)).toBe(true);
    expect(RolePolicy.allows("ASESOR", Permission.PerfumeDelete)).toBe(false);
    expect(RolePolicy.allows("ASESOR", Permission.SettingsUpdate)).toBe(false);
    expect(RolePolicy.allows("ADMIN", Permission.PerfumeDelete)).toBe(true);
  });
});

describe("Value objects", () => {
  it("normaliza celulares colombianos con el indicativo 57", () => {
    expect(PhoneNumber.create("300 123 4567").digits).toBe("573001234567");
    expect(PhoneNumber.create("+57 300 123 4567").format()).toBe("+57 300 123 4567");
    expect(() => PhoneNumber.create("123")).toThrow(ValidationError);
  });

  it("genera slugs sin tildes ni símbolos", () => {
    expect(Slug.fromText("Maison Francis Kurkdjian Baccarat Rouge 540").value).toBe("maison-francis-kurkdjian-baccarat-rouge-540");
    expect(Slug.fromText("Árabe Ñandú").value).toBe("arabe-nandu");
  });

  it("solo acepta enlaces https en redes sociales", () => {
    expect(StoreSettings.create({ ...StoreSettings.empty().toJSON(), instagram: "instagram.com/prestige" }).toJSON().instagram).toBe("https://instagram.com/prestige");
    expect(() => StoreSettings.create({ ...StoreSettings.empty().toJSON(), facebook: "javascript:alert(1)" })).toThrow(ValidationError);
  });
});

describe("Order", () => {
  const customer = { name: "Ana", phone: PhoneNumber.create("3001234567"), documentId: "", city: "Pasto", address: "Calle 1", neighborhood: "" };

  it("calcula el total con las cantidades", () => {
    const order = Order.place({
      reference: "PP-1",
      customer,
      paymentMethod: "NEQUI_DAVIPLATA",
      notes: "",
      lines: [{ perfumeName: "Sauvage", house: "Dior", ml: 100, type: "ORIGINAL", unitPrice: Money.cop(620000), quantity: 2 }],
    });
    expect(order.total().amount).toBe(1_240_000);
    expect(order.itemCount()).toBe(2);
  });

  it("no acepta métodos de pago eliminados (tarjeta o contra entrega)", () => {
    expect(() =>
      Order.place({ reference: "PP-1", customer, paymentMethod: "CONTRA_ENTREGA", notes: "", lines: [{ perfumeName: "X", house: "Y", ml: 100, type: "ORIGINAL", unitPrice: Money.cop(1), quantity: 1 }] }),
    ).toThrow(ValidationError);
  });
});
