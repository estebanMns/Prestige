"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useToast } from "../common/Toast";
import { ApiError, api } from "../../lib/ApiClient";

/** Activación del doble factor (TOTP) y cambio de contraseña. */
export function SecurityPanel({ totpEnabled }: { totpEnabled: boolean }) {
  return (
    <div className="grid max-w-[900px] gap-10 lg:grid-cols-2">
      <TotpSetup enabled={totpEnabled} />
      <ChangePassword />
    </div>
  );
}

function TotpSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const begin = async () => {
    setError(null);
    try {
      setSetup(await api.post("/api/auth/totp"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo generar el código QR.");
    }
  };

  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await api.post("/api/auth/totp/confirm", { code });
      toast("Verificación en dos pasos activada");
      setSetup(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo verificar el código.");
    }
  };

  return (
    <section className="rounded-[14px] border border-line bg-ink-2 p-6">
      <h2 className="mb-1 text-2xl">Verificación en dos pasos</h2>
      <p className="note mb-4">
        {enabled
          ? "Está activa. Al iniciar sesión te pediremos el código de tu aplicación autenticadora."
          : "Protege la cuenta con un código de Google Authenticator, Microsoft Authenticator o similar."}
      </p>
      {!setup ? (
        <button type="button" className={`btn ${enabled ? "btn-ghost" : ""}`} onClick={begin}>
          {enabled ? "Configurar en otro celular" : "Activar verificación en dos pasos"}
        </button>
      ) : (
        <form className="grid gap-3" onSubmit={confirm}>
          <ol className="m-0 grid list-decimal gap-1 pl-5 text-sm text-muted">
            <li>Abre tu aplicación autenticadora.</li>
            <li>Escanea este código QR.</li>
            <li>Escribe el código de 6 dígitos que aparece.</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qrDataUrl} alt="Código QR para la aplicación autenticadora" width={200} height={200} className="rounded-lg bg-white p-2" />
          <p className="note m-0">
            ¿No puedes escanearlo? Clave manual: <span className="mono select-all text-fg">{setup.secret}</span>
          </p>
          <div className="field">
            <label htmlFor="totp-code">Código de verificación</label>
            <input id="totp-code" className="input mono tracking-[0.3em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </div>
          <button type="submit" className="btn justify-self-start" disabled={code.length !== 6}>
            Confirmar y activar
          </button>
        </form>
      )}
      {error && <p className="error-text mt-3" role="alert">{error}</p>}
    </section>
  );
}

function ChangePassword() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (form.newPassword !== form.confirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/auth/password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      router.replace("/admin/login");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cambiar la contraseña.");
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[14px] border border-line bg-ink-2 p-6">
      <h2 className="mb-1 text-2xl">Cambiar contraseña</h2>
      <p className="note mb-4">Al cambiarla se cierran todas tus sesiones abiertas y tendrás que entrar de nuevo.</p>
      <form className="grid gap-3" onSubmit={submit}>
        {(
          [
            ["currentPassword", "Contraseña actual", "current-password"],
            ["newPassword", "Nueva contraseña", "new-password"],
            ["confirm", "Repite la nueva contraseña", "new-password"],
          ] as const
        ).map(([key, label, auto]) => (
          <div key={key} className="field">
            <label htmlFor={`pw-${key}`}>{label}</label>
            <input id={`pw-${key}`} type="password" className="input" autoComplete={auto} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
        <p className="note m-0">Mínimo 12 caracteres, con mayúsculas, minúsculas y números.</p>
        {error && <p className="error-text m-0" role="alert">{error}</p>}
        <button type="submit" className="btn justify-self-start" disabled={saving}>
          {saving ? "Guardando…" : "Actualizar contraseña"}
        </button>
      </form>
    </section>
  );
}
