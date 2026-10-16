import "server-only";
import type { ChatAssistant, ChatMessage } from "@/core/application/ports/services";
import { assistantSystemPrompt } from "./assistantPrompt";

const GROK_ENDPOINT = "https://api.x.ai/v1/chat/completions";
const TIMEOUT_MS = 20_000;
const FALLBACK_TEXT = "No pude responder en este momento. Escríbenos por WhatsApp y un asesor te ayuda.";

interface GrokChatResponse {
  choices?: { message?: { content?: string | null } }[];
}

/** Asesor virtual con la API de Grok (xAI). Responde solo con información del catálogo que recibe. */
export class GrokChatAssistant implements ChatAssistant {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async reply({ history, catalog, storeName }: { history: ChatMessage[]; catalog: string; storeName: string }): Promise<string> {
    const response = await fetch(GROK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        messages: [
          { role: "system", content: assistantSystemPrompt(storeName, catalog) },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      // El detalle del error queda en el servidor; al cliente solo le llega el mensaje de respaldo.
      console.error(`Grok respondió ${response.status}: ${(await response.text()).slice(0, 300)}`);
      return FALLBACK_TEXT;
    }

    const data = (await response.json()) as GrokChatResponse;
    return data.choices?.[0]?.message?.content?.trim() || FALLBACK_TEXT;
  }
}
