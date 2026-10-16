import { z } from "zod";
import { CONCENTRATIONS, GENDERS, PERFUME_CATEGORIES, PRODUCT_TYPES } from "@/core/domain/perfume/PerfumeEnums";
import { PAYMENT_METHODS } from "@/core/domain/order/Order";

/*
 * Esquemas de entrada de la API. Validan forma y tipos en el borde del sistema;
 * las reglas de negocio (precio > 0, presentaciones sin repetir, etc.) las aplica el dominio.
 */

const text = (max: number) => z.string().trim().max(max);

export const loginSchema = z.object({
  email: text(254),
  password: z.string().min(1, "Escribe tu contraseña.").max(200),
  totpCode: z.string().trim().max(10).optional(),
});

export const totpConfirmSchema = z.object({ code: z.string().trim().min(6).max(10) });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(1).max(200),
});

export const perfumeDraftSchema = z.object({
  name: text(120),
  house: text(120),
  category: z.enum(PERFUME_CATEGORIES),
  gender: z.enum(GENDERS),
  concentration: z.enum(CONCENTRATIONS),
  description: text(2000).default(""),
  notes: z.object({ top: text(300).default(""), heart: text(300).default(""), base: text(300).default("") }),
  presentations: z
    .array(
      z.object({
        ml: z.coerce.number().int(),
        type: z.enum(PRODUCT_TYPES),
        priceCop: z.coerce.number().int(),
        inStock: z.boolean().default(true),
      }),
    )
    .max(12),
  imageKey: z.string().max(200).nullable().default(null),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#c9a86a"),
  featured: z.boolean().default(false),
});

export const catalogFilterSchema = z.object({
  category: z.enum(PERFUME_CATEGORIES).optional(),
  gender: z.enum(GENDERS).optional(),
  type: z.enum(PRODUCT_TYPES).optional(),
  search: text(80).optional(),
});

export const uploadTicketSchema = z.object({
  contentType: z.string().max(60),
  sizeBytes: z.number().int().positive(),
});

export const placeOrderSchema = z.object({
  items: z
    .array(z.object({ perfumeId: z.uuid(), ml: z.number().int().positive(), type: z.enum(PRODUCT_TYPES), quantity: z.number().int().min(1).max(20) }))
    .min(1)
    .max(30),
  customer: z.object({
    name: text(120),
    phone: text(30),
    documentId: text(20).default(""),
    city: text(80),
    address: text(200),
    neighborhood: text(80).default(""),
  }),
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: text(500).default(""),
});

export const storeSettingsSchema = z.object({
  whatsapp: text(30).default(""),
  email: text(254).default(""),
  address: text(200).default(""),
  hours: text(120).default(""),
  instagram: text(200).default(""),
  tiktok: text(200).default(""),
  facebook: text(200).default(""),
  about: text(1500).default(""),
});

export const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .min(1)
    .max(30),
});
