"use client";

/** Error de la API con el código y el campo que devuelve el servidor. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly field?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

/**
 * Cliente HTTP del navegador. Envía JSON, interpreta los errores de la API y, si el access token
 * venció (401), renueva la sesión una sola vez con el refresh token y repite la petición.
 * Varias peticiones simultáneas comparten la misma renovación.
 */
export class ApiClient {
  private refreshing: Promise<boolean> | null = null;

  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: "GET" });
  }
  async post<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
  }
  async put<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, { method: "PUT", body: JSON.stringify(body) });
  }
  async delete(url: string): Promise<void> {
    await this.request<void>(url, { method: "DELETE" });
  }

  private async request<T>(url: string, init: RequestInit, retried = false): Promise<T> {
    const response = await fetch(url, {
      ...init,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...init.headers },
    });

    if (response.status === 401 && !retried && !url.startsWith("/api/auth/")) {
      if (await this.refreshSession()) return this.request<T>(url, init, true);
    }
    if (response.status === 204) return undefined as T;

    const payload = (await response.json().catch(() => null)) as { data?: T; error?: { code: string; message: string; field?: string; retryAfterSeconds?: number } } | null;
    if (!response.ok) {
      const e = payload?.error;
      throw new ApiError(response.status, e?.code ?? "UNKNOWN", e?.message ?? "No se pudo completar la solicitud.", e?.field, e?.retryAfterSeconds);
    }
    return payload?.data as T;
  }

  private refreshSession(): Promise<boolean> {
    this.refreshing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        this.refreshing = null;
      });
    return this.refreshing;
  }
}

export const api = new ApiClient();
