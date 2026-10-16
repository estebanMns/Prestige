"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { StoreSettingsProps } from "@/core/domain/settings/StoreSettings";
import { useToast } from "../common/Toast";
import { ApiError, api } from "../../lib/ApiClient";

type Key = keyof StoreSettingsProps;

const FIELDS: { key: Key; label: string; placeholder: string; help?: string; type?: string }[] = [
  { key: "whatsapp", label: "WhatsApp corporativo", placeholder: "573001234567", type: "tel", help: "Con indicativo (57 para Colombia). Aquí llegan los pedidos con el total." },
  { key: "email", label: "Correo de contacto", placeholder: "ventas@perfumeriaprestige.com", type: "email" },
  { key: "hours", label: "Horario de atención", placeholder: "Lun a sáb · 9:00 a. m. – 7:00 p. m." },
  { key: "address", label: "Dirección de la tienda", placeholder: "Calle 18 # 25-40, Centro", help: "Déjalo vacío si solo vendes en línea." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/perfumeriaprestige", type: "url" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@perfumeriaprestige", type: "url" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/perfumeriaprestige", type: "url" },
];

export function SettingsForm({ initial }: { initial: StoreSettingsProps }) {
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      setForm(await api.put<StoreSettingsProps>("/api/admin/settings", form));
      toast("Datos de la tienda guardados");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? { message: e.message, field: e.field } : { message: "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid max-w-[760px] gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="field">
            <label htmlFor={`st-${f.key}`}>{f.label}</label>
            <input
              id={`st-${f.key}`}
              type={f.type ?? "text"}
              className={`input ${error?.field === f.key ? "border-bad" : ""}`}
              value={form[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
            {f.help && <span className="note">{f.help}</span>}
          </div>
        ))}
      </div>
      <div className="field">
        <label htmlFor="st-about">Texto «Sobre nosotros»</label>
        <textarea id="st-about" className="input" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} maxLength={1500} />
        <span className="note">Si lo dejas vacío se muestra el texto predeterminado.</span>
      </div>
      {error && <p className="error-text m-0" role="alert">{error.message}</p>}
      <button type="submit" className="btn justify-self-start" disabled={saving}>
        {saving ? "Guardando…" : "Guardar datos de la tienda"}
      </button>
    </form>
  );
}
