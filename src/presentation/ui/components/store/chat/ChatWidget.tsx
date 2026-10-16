"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { PerfumeDTO } from "@/core/application/dto/PerfumeDTO";
import type { AssistantReply } from "@/core/application/use-cases/chat/AskAssistantUseCase";
import { ArrowIcon, CloseIcon } from "../../common/Icons";
import { PerfumeImage } from "../../common/PerfumeImage";
import { ApiError, api } from "../../../lib/ApiClient";
import { useUi } from "../../../state/uiStore";

interface Message {
  role: "user" | "assistant";
  content: string;
  perfumeIds?: string[];
}

const WELCOME: Message = {
  role: "assistant",
  content: "¡Hola! Soy el asesor de Perfumería Prestige. Pregúntame por cualquier perfume y te digo precio, mililitros, si lo tenemos original o 1.1 y sus notas.",
};
const SUGGESTIONS = ["¿Cuánto cuesta Sauvage?", "Un árabe dulce para mujer", "¿Qué nicho me recomiendas para la noche?", "¿Qué es un 1.1?"];

/** Asesor virtual flotante. El historial vive solo en la pestaña del cliente. */
export function ChatWidget({ perfumes }: { perfumes: PerfumeDTO[] }) {
  const { panel, open, close, showPerfume } = useUi();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const isOpen = panel === "chat";

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const history = [...messages, { role: "user" as const, content: question }];
    setMessages(history);
    setInput("");
    setBusy(true);
    try {
      const reply = await api.post<AssistantReply>("/api/chat", { messages: history.filter((m) => m !== WELCOME).map(({ role, content }) => ({ role, content })) });
      setMessages((m) => [...m, { role: "assistant", content: reply.text, perfumeIds: reply.mentionedIds }]);
    } catch (e) {
      const content = e instanceof ApiError && e.code === "RATE_LIMITED" ? "Recibí muchas preguntas seguidas. Dame un minuto y vuelve a escribirme." : "No pude responder en este momento. Inténtalo de nuevo o escríbenos por WhatsApp.";
      setMessages((m) => [...m, { role: "assistant", content }]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => open("chat")}
        className="fixed bottom-[max(20px,calc(env(safe-area-inset-bottom,0px)+16px))] right-[max(20px,calc(env(safe-area-inset-right,0px)+16px))] z-50 flex items-center gap-2.5 rounded-full bg-accent py-3 pl-3.5 pr-5 font-semibold text-on-accent shadow-[0_18px_40px_-12px_rgba(var(--accent-rgb),.55)]"
      >
        <span className="h-[30px] w-[30px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff6e6,#c99a5c_55%,#6b4a24)]" />
        Asesor Prestige
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Asesor Prestige"
      className="fixed bottom-[max(20px,calc(env(safe-area-inset-bottom,0px)+16px))] right-[max(20px,calc(env(safe-area-inset-right,0px)+16px))] z-[55] flex h-[min(620px,calc(100dvh-110px))] w-[min(400px,calc(100%-32px))] flex-col overflow-hidden rounded-[20px] border border-[var(--line-strong)] bg-ink-2 shadow-2xl"
    >
      <div className="flex items-center gap-3 border-b border-line p-4">
        <span className="h-9 w-9 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff6e6,#c99a5c_55%,#6b4a24)]" />
        <div>
          <b className="block font-display text-xl font-normal leading-tight">Asesor Prestige</b>
          <small className="text-xs text-muted">Consulta precios, notas y disponibilidad</small>
        </div>
        <button type="button" className="icon-btn ml-auto h-9 w-9" onClick={close} aria-label="Cerrar asesor">
          <CloseIcon />
        </button>
      </div>

      <div ref={logRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "self-end rounded-br-sm bg-accent text-on-accent" : "self-start rounded-bl-sm border border-line bg-ink-3"}`}>
              {m.content}
            </div>
            {m.perfumeIds?.map((id) => {
              const p = perfumes.find((x) => x.id === id);
              if (!p) return null;
              return (
                <button key={id} type="button" onClick={() => showPerfume(id)} className="grid w-full grid-cols-[46px_1fr_auto] items-center gap-2.5 rounded-xl border border-line bg-ink p-2 text-left hover:border-accent">
                  <span className="media h-[54px] w-[46px] rounded-lg">
                    <PerfumeImage imageUrl={p.imageUrl} color={p.color} alt={p.name} illustrationClass="w-[60%]" />
                  </span>
                  <span className="min-w-0">
                    <b className="block font-display text-[15px] font-normal leading-tight">{p.name}</b>
                    <small className="text-[11.5px] text-muted">{p.house}</small>
                  </span>
                  <span className="mono whitespace-nowrap text-xs text-accent">{p.startingPriceLabel}</span>
                </button>
              );
            })}
          </div>
        ))}
        {busy && <div className="self-start rounded-2xl border border-line bg-ink-3 px-3.5 py-2.5 text-sm italic text-muted">Buscando en la vitrina…</div>}
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => void send(s)} className="rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-fg">
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-line p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={600} placeholder="Escribe el nombre de un perfume…" aria-label="Mensaje" className="input min-w-0 flex-1 rounded-full" />
        <button type="submit" disabled={busy} className="grid h-11 w-11 flex-none place-items-center rounded-full bg-accent text-on-accent disabled:opacity-50" aria-label="Enviar">
          <ArrowIcon width={18} height={18} />
        </button>
      </form>
    </div>
  );
}
