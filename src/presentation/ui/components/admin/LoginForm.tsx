"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, api } from "../../lib/ApiClient";

/** Inicio de sesión en dos pasos: correo + contraseña y, si el usuario lo tiene activo, código TOTP. */
export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/api/auth/login", { email, password, totpCode: needsTotp ? totpCode : undefined });
      router.replace(next);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.code === "TOTP_REQUIRED") {
        setNeedsTotp(true);
      } else if (e instanceof ApiError && (e.code === "ACCOUNT_LOCKED" || e.code === "RATE_LIMITED")) {
        const minutes = Math.max(1, Math.ceil((e.retryAfterSeconds ?? 60) / 60));
        setError(`${e.message} Espera ${minutes} min.`);
      } else {
        setError(e instanceof ApiError ? e.message : "No pudimos conectar con el servidor.");
      }
      setPassword(needsTotp ? password : "");
      setTotpCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <div>
        <div className="eyebrow">{needsTotp ? "Verificación en dos pasos" : "Iniciar sesión"}</div>
        <h2 className="mt-2 text-[28px]">{needsTotp ? "Ingresa tu código" : "Bienvenido de nuevo"}</h2>
      </div>

      {!needsTotp ? (
        <>
          <div className="field">
            <label htmlFor="login-email">Correo</label>
            <input id="login-email" type="email" className="input" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="login-password">Contraseña</label>
            <div className="relative">
              <input id="login-password" type={showPassword ? "text" : "password"} className="input pr-20" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-muted" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="field">
          <label htmlFor="login-totp">Código de 6 dígitos de tu app autenticadora</label>
          <input id="login-totp" className="input mono text-center text-2xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} />
        </div>
      )}

      {error && <p className="error-text m-0" role="alert">{error}</p>}
      <button type="submit" className="btn" disabled={busy}>
        {busy ? "Verificando…" : needsTotp ? "Verificar y entrar" : "Ingresar al panel"}
      </button>
      {needsTotp && (
        <button type="button" className="note underline" onClick={() => { setNeedsTotp(false); setPassword(""); }}>
          Volver
        </button>
      )}
    </form>
  );
}
