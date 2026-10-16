import { describe, expect, it } from "vitest";
import { PerfumePresenter } from "@/core/application/dto/PerfumeDTO";
import { AuthorizationService } from "@/core/application/services/AuthorizationService";
import { WhatsAppOrderMessage } from "@/core/application/services/WhatsAppOrderMessage";
import { PlaceOrderUseCase } from "@/core/application/use-cases/orders/PlaceOrderUseCase";
import { CreatePerfumeUseCase, DeletePerfumeUseCase } from "@/core/application/use-cases/perfumes/ManagePerfumeUseCases";
import { RequestImageUploadUseCase } from "@/core/application/use-cases/perfumes/RequestImageUploadUseCase";
import type { Actor } from "@/core/domain/auth/Actor";
import { ForbiddenError, UnauthenticatedError, ValidationError } from "@/core/domain/shared/DomainError";
import { StoreSettings } from "@/core/domain/settings/StoreSettings";
import { FakeStorage, FixedClock, InMemoryAudit, InMemoryPerfumes, InMemorySettings, SequentialIds } from "../fakes/InMemory";
import { draft, perfume } from "../fakes/builders";

const admin: Actor = { userId: "u-admin", email: "a@p.co", role: "ADMIN" };
const asesor: Actor = { userId: "u-asesor", email: "b@p.co", role: "ASESOR" };

function deps() {
  const perfumes = new InMemoryPerfumes();
  const storage = new FakeStorage();
  const audit = new InMemoryAudit();
  const presenter = new PerfumePresenter(storage);
  return { perfumes, storage, audit, presenter, authz: new AuthorizationService(), clock: new FixedClock(), ids: new SequentialIds() };
}

describe("Gestión de perfumes", () => {
  it("crea un perfume con slug único y deja registro de auditoría", async () => {
    const d = deps();
    const create = new CreatePerfumeUseCase(d.perfumes, d.authz, d.presenter, d.audit, d.ids, d.clock);
    const a = await create.execute({ actor: asesor, draft: draft() });
    const b = await create.execute({ actor: admin, draft: draft() });
    expect(a.slug).toBe("dior-sauvage");
    expect(b.slug).toBe("dior-sauvage-aaaa");
    expect(a.startingPriceLabel).toMatch(/160\.000/);
    expect(d.audit.entries.map((e) => e.action)).toEqual(["perfume.created", "perfume.created"]);
  });

  it("sin sesión no se puede crear", async () => {
    const d = deps();
    const create = new CreatePerfumeUseCase(d.perfumes, d.authz, d.presenter, d.audit, d.ids, d.clock);
    await expect(create.execute({ actor: null, draft: draft() })).rejects.toThrow(UnauthenticatedError);
  });

  it("solo el administrador puede eliminar, y se borra también la foto", async () => {
    const d = deps();
    const p = perfume(undefined, { imageKey: "perfumes/foto.jpg" });
    await d.perfumes.save(p);
    const remove = new DeletePerfumeUseCase(d.perfumes, d.authz, d.storage, d.audit, d.clock);
    await expect(remove.execute({ actor: asesor, id: p.id })).rejects.toThrow(ForbiddenError);
    await remove.execute({ actor: admin, id: p.id });
    expect(d.perfumes.items.size).toBe(0);
    expect(d.storage.deleted).toEqual(["perfumes/foto.jpg"]);
  });

  it("solo autoriza subir imágenes JPG, PNG o WEBP de hasta 5 MB", async () => {
    const d = deps();
    const upload = new RequestImageUploadUseCase(d.storage, d.authz, d.ids);
    const ticket = await upload.execute({ actor: asesor, contentType: "image/jpeg", sizeBytes: 200_000 });
    expect(ticket.key).toMatch(/^perfumes\/.+\.jpg$/);
    await expect(upload.execute({ actor: asesor, contentType: "image/svg+xml", sizeBytes: 100 })).rejects.toThrow(ValidationError);
    await expect(upload.execute({ actor: asesor, contentType: "image/png", sizeBytes: 6 * 1024 * 1024 })).rejects.toThrow(ValidationError);
  });
});

describe("PlaceOrderUseCase", () => {
  const customer = { name: "Ana Pérez", phone: "300 123 4567", documentId: "", city: "Pasto", address: "Calle 18 # 25-40", neighborhood: "Centro" };

  async function setup() {
    const d = deps();
    const p = perfume();
    await d.perfumes.save(p);
    const settings = new InMemorySettings(StoreSettings.create({ ...StoreSettings.empty().toJSON(), whatsapp: "573009998877" }));
    return { useCase: new PlaceOrderUseCase(d.perfumes, settings, d.ids, new WhatsAppOrderMessage("Perfumería Prestige")), perfumeId: p.id };
  }

  it("usa los precios del catálogo y arma el enlace de WhatsApp con el total", async () => {
    const { useCase, perfumeId } = await setup();
    const order = await useCase.execute({
      items: [
        { perfumeId, ml: 100, type: "ORIGINAL", quantity: 2 },
        { perfumeId, ml: 100, type: "REPLICA_1_1", quantity: 1 },
      ],
      customer,
      paymentMethod: "TRANSFERENCIA",
      notes: "Es un regalo",
    });
    expect(order.totalCop).toBe(620000 * 2 + 160000);
    expect(order.reference).toBe("PP-AAAAAA");
    expect(order.whatsappUrl.startsWith("https://wa.me/573009998877?text=")).toBe(true);
    expect(order.message).toContain("*TOTAL: $ 1.400.000*");
    expect(order.message).toContain("+57 300 123 4567");
  });

  it("rechaza presentaciones que no existen (no confía en el navegador)", async () => {
    const { useCase, perfumeId } = await setup();
    await expect(
      useCase.execute({ items: [{ perfumeId, ml: 30, type: "ORIGINAL", quantity: 1 }], customer, paymentMethod: "TRANSFERENCIA", notes: "" }),
    ).rejects.toThrow(/ya no está disponible/);
  });

  it("valida los datos de entrega", async () => {
    const { useCase, perfumeId } = await setup();
    await expect(
      useCase.execute({ items: [{ perfumeId, ml: 100, type: "ORIGINAL", quantity: 1 }], customer: { ...customer, address: " " }, paymentMethod: "TRANSFERENCIA", notes: "" }),
    ).rejects.toThrow(/dirección/);
  });
});
