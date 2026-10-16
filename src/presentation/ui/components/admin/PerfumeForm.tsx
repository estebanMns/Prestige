"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { PerfumeDTO } from "@/core/application/dto/PerfumeDTO";
import {
  CATEGORY_LABELS,
  CONCENTRATION_LABELS,
  GENDER_LABELS,
  PRODUCT_TYPE_LABELS,
  type Concentration,
  type Gender,
  type PerfumeCategory,
  type ProductType,
} from "@/core/domain/perfume/PerfumeEnums";
import { CloseIcon } from "../common/Icons";
import { useToast } from "../common/Toast";
import { ApiError, api } from "../../lib/ApiClient";
import { ImageUploader } from "./ImageUploader";

interface VariantRow {
  ml: string;
  type: ProductType;
  priceCop: string;
  inStock: boolean;
}

interface FormState {
  name: string;
  house: string;
  category: PerfumeCategory;
  gender: Gender;
  concentration: Concentration;
  description: string;
  top: string;
  heart: string;
  base: string;
  variants: VariantRow[];
  imageKey: string | null;
  imageUrl: string | null;
  color: string;
  featured: boolean;
}

function initialState(p?: PerfumeDTO): FormState {
  return {
    name: p?.name ?? "",
    house: p?.house ?? "",
    category: p?.category ?? "DISENADOR",
    gender: p?.gender ?? "HOMBRE",
    concentration: p?.concentration ?? "EAU_DE_PARFUM",
    description: p?.description ?? "",
    top: p?.notes.top ?? "",
    heart: p?.notes.heart ?? "",
    base: p?.notes.base ?? "",
    variants: p?.presentations.map((v) => ({ ml: String(v.ml), type: v.type, priceCop: String(v.priceCop), inStock: v.inStock })) ?? [
      { ml: "50", type: "ORIGINAL", priceCop: "", inStock: true },
      { ml: "100", type: "ORIGINAL", priceCop: "", inStock: true },
    ],
    imageKey: p?.imageKey ?? null,
    imageUrl: p?.imageUrl ?? null,
    color: p?.color ?? "#c9a86a",
    featured: p?.featured ?? false,
  };
}

function Select<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: Record<T, string>; onChange(v: T): void }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {(Object.entries(options) as [T, string][]).map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Formulario de alta y edición de perfumes. Envía un borrador; el servidor aplica las reglas del dominio. */
export function PerfumeForm({ perfume }: { perfume?: PerfumeDTO }) {
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const [form, setForm] = useState<FormState>(() => initialState(perfume));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const setVariant = (i: number, patch: Partial<VariantRow>) => set({ variants: form.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const draft = {
      name: form.name,
      house: form.house,
      category: form.category,
      gender: form.gender,
      concentration: form.concentration,
      description: form.description,
      notes: { top: form.top, heart: form.heart, base: form.base },
      presentations: form.variants
        .filter((v) => v.ml.trim() || v.priceCop.trim())
        .map((v) => ({ ml: Number(v.ml.replace(/\D/g, "")), type: v.type, priceCop: Number(v.priceCop.replace(/\D/g, "")), inStock: v.inStock })),
      imageKey: form.imageKey,
      color: form.color,
      featured: form.featured,
    };
    try {
      if (perfume) await api.put(`/api/admin/perfumes/${perfume.id}`, draft);
      else await api.post("/api/admin/perfumes", draft);
      toast(perfume ? "Cambios guardados" : `Publicado: ${form.name}`);
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-7 lg:grid-cols-[280px_1fr]" noValidate>
      <div className="grid content-start gap-4">
        <ImageUploader imageUrl={form.imageUrl} onUploaded={(imageKey, imageUrl) => set({ imageKey, imageUrl })} onRemoved={() => set({ imageKey: null, imageUrl: null })} />
        <div className="field">
          <label htmlFor="pf-color">Color del frasco (si no hay foto)</label>
          <input id="pf-color" type="color" className="input h-11 p-1" value={form.color} onChange={(e) => set({ color: e.target.value })} />
        </div>
      </div>

      <div className="grid min-w-0 content-start gap-4">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="pf-name">Nombre del perfume</label>
            <input id="pf-name" className="input" required value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Sauvage Elixir" />
          </div>
          <div className="field">
            <label htmlFor="pf-house">Casa / marca</label>
            <input id="pf-house" className="input" required value={form.house} onChange={(e) => set({ house: e.target.value })} placeholder="Dior" />
          </div>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-3">
          <Select id="pf-cat" label="Familia" value={form.category} options={CATEGORY_LABELS} onChange={(category) => set({ category })} />
          <Select id="pf-gen" label="Para" value={form.gender} options={GENDER_LABELS} onChange={(gender) => set({ gender })} />
          <Select id="pf-conc" label="Concentración" value={form.concentration} options={CONCENTRATION_LABELS} onChange={(concentration) => set({ concentration })} />
        </div>
        <div className="field">
          <label htmlFor="pf-desc">Detalles</label>
          <textarea id="pf-desc" className="input" value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Cómo huele, ocasión, duración…" maxLength={2000} />
        </div>
        <div className="grid gap-3.5 sm:grid-cols-3">
          {(
            [
              ["top", "Notas de salida"],
              ["heart", "Notas de corazón"],
              ["base", "Notas de fondo"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="field">
              <label htmlFor={`pf-${key}`}>{label}</label>
              <input id={`pf-${key}`} className="input" value={form[key]} onChange={(e) => set({ [key]: e.target.value } as Partial<FormState>)} />
            </div>
          ))}
        </div>

        <fieldset className="field">
          <legend className="label mb-2">Presentaciones · mililitros, tipo y precio (COP)</legend>
          <div className="grid gap-2">
            {form.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[90px_1fr_1.3fr_auto_40px]">
                <div className="field">
                  <label htmlFor={`v-ml-${i}`}>ml</label>
                  <input id={`v-ml-${i}`} className="input" inputMode="numeric" value={v.ml} onChange={(e) => setVariant(i, { ml: e.target.value })} />
                </div>
                <Select id={`v-type-${i}`} label="Tipo" value={v.type} options={PRODUCT_TYPE_LABELS} onChange={(type) => setVariant(i, { type })} />
                <div className="field">
                  <label htmlFor={`v-price-${i}`}>Precio</label>
                  <input id={`v-price-${i}`} className="input" inputMode="numeric" value={v.priceCop} onChange={(e) => setVariant(i, { priceCop: e.target.value })} placeholder="450000" />
                </div>
                <label className="flex items-center gap-2 pb-3 text-sm">
                  <input type="checkbox" checked={v.inStock} onChange={(e) => setVariant(i, { inStock: e.target.checked })} className="h-4 w-4 accent-[var(--accent)]" />
                  Disponible
                </label>
                <button type="button" className="icon-btn h-10 w-10 rounded-[10px]" aria-label="Quitar presentación" onClick={() => set({ variants: form.variants.filter((_, j) => j !== i) })}>
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-2 justify-self-start"
            onClick={() => set({ variants: [...form.variants, { ml: "100", type: "ORIGINAL", priceCop: "", inStock: true }] })}
          >
            + Agregar presentación
          </button>
        </fieldset>

        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="h-[18px] w-[18px] accent-[var(--accent)]" />
          Mostrar como destacado
        </label>

        {error && <p className="error-text m-0" role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2.5">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Guardando…" : perfume ? "Guardar cambios" : "Publicar perfume"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => router.push("/admin")}>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
