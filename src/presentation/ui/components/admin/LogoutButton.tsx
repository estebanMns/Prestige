"use client";

import { useRouter } from "next/navigation";
import { api } from "../../lib/ApiClient";

export function LogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await api.post("/api/auth/logout").catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  };
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
      Salir
    </button>
  );
}
