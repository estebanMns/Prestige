"use client";

import { useRef, useState, type DragEvent } from "react";
import type { ImageUploadTicket } from "@/core/application/use-cases/perfumes/RequestImageUploadUseCase";
import { ApiError, api } from "../../lib/ApiClient";

/** Reduce la foto en el navegador (máx. 1400 px, JPEG 86 %) antes de subirla: carga más rápida para el cliente. */
async function optimize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen."))), "image/jpeg", 0.86));
}

interface Props {
  imageUrl: string | null;
  onUploaded(key: string, url: string): void;
  onRemoved(): void;
}

/**
 * Subida directa al almacenamiento: pide al servidor una URL firmada y envía el archivo con PUT.
 * El servidor nunca procesa el archivo, solo autoriza la subida.
 */
export function ImageUploader({ imageUrl, onUploaded, onRemoved }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("Elige un archivo de imagen (JPG, PNG o WEBP).");
      return;
    }
    setStatus("uploading");
    setMessage(null);
    try {
      const blob = await optimize(file);
      const ticket = await api.post<ImageUploadTicket>("/api/admin/uploads", { contentType: "image/jpeg", sizeBytes: blob.size });
      const isLocal = ticket.uploadUrl.startsWith("/");
      const response = await fetch(ticket.uploadUrl, {
        method: ticket.method,
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
        credentials: isLocal ? "same-origin" : "omit",
      });
      if (!response.ok) throw new Error("upload");
      onUploaded(ticket.key, ticket.publicUrl);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.");
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void upload(e.dataTransfer.files[0]);
  };

  return (
    <div className="field">
      <span className="label">Foto del perfume</span>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-[14px] border border-dashed bg-ink text-center text-[13px] text-muted transition ${dragging ? "border-accent" : "border-[var(--line-strong)] hover:border-accent"}`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Foto del perfume" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="p-5">
            {status === "uploading" ? "Subiendo foto…" : "Toca o arrastra una foto"}
            <br />
            <small>JPG, PNG o WEBP · se optimiza sola</small>
          </span>
        )}
        {status === "uploading" && imageUrl && <span className="absolute inset-x-0 bottom-0 bg-[rgba(var(--ink-rgb),.8)] p-2">Subiendo…</span>}
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void upload(e.target.files?.[0])} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => input.current?.click()} disabled={status === "uploading"}>
          {imageUrl ? "Cambiar foto" : "Elegir foto"}
        </button>
        {imageUrl && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRemoved}>
            Quitar
          </button>
        )}
      </div>
      {message && <p className="error-text m-0">{message}</p>}
    </div>
  );
}
