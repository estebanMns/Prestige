import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatAssistant, ChatMessage } from "@/core/application/ports/services";
import { assistantSystemPrompt } from "./assistantPrompt";

/** Asesor virtual con la API de Claude. Responde solo con información del catálogo que recibe. */
export class AnthropicChatAssistant implements ChatAssistant {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async reply({ history, catalog, storeName }: { history: ChatMessage[]; catalog: string; storeName: string }): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      system: assistantSystemPrompt(storeName, catalog),
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    });
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    return text || "No pude responder en este momento. Escríbenos por WhatsApp y un asesor te ayuda.";
  }
}
