"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset(): void }) {
  return (
    <main className="wrap grid min-h-[70vh] place-items-center text-center">
      <div>
        <div className="eyebrow">Algo salió mal</div>
        <h1 className="my-4 text-5xl">No pudimos cargar esta página</h1>
        <p className="mb-6 text-muted">Puede ser un problema momentáneo de conexión. Inténtalo de nuevo.</p>
        <button type="button" className="btn" onClick={reset}>
          Reintentar
        </button>
      </div>
    </main>
  );
}
