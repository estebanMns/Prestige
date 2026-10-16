import { ValidationError } from "../../../domain/shared/DomainError";
import type { PerfumeDTO } from "../../dto/PerfumeDTO";
import type { ChatAssistant, ChatMessage, RateLimiter } from "../../ports/services";
import { RateLimitedError } from "../../../domain/shared/DomainError";
import type { UseCase } from "../../ports/UseCase";
import type { ListPerfumesUseCase } from "../perfumes/CatalogQueries";

export interface AskAssistantInput {
  history: ChatMessage[];
  clientKey: string;
}

export interface AssistantReply {
  text: string;
  /** Perfumes del catálogo mencionados en la respuesta, para mostrarlos como tarjetas. */
  mentionedIds: string[];
}

/** El asesor virtual responde usando únicamente el catálogo vigente. */
export class AskAssistantUseCase implements UseCase<AskAssistantInput, AssistantReply> {
  static readonly MAX_TURNS = 12;
  static readonly MAX_CHARS = 600;

  constructor(
    private readonly catalog: ListPerfumesUseCase,
    private readonly assistant: ChatAssistant,
    private readonly rateLimiter: RateLimiter,
    private readonly storeName: string,
  ) {}

  async execute({ history, clientKey }: AskAssistantInput): Promise<AssistantReply> {
    const limit = await this.rateLimiter.consume(`chat:${clientKey}`);
    if (!limit.allowed) throw new RateLimitedError(limit.retryAfterSeconds);

    const trimmed = history.slice(-AskAssistantUseCase.MAX_TURNS).map((m) => ({ role: m.role, content: m.content.slice(0, AskAssistantUseCase.MAX_CHARS) }));
    const last = trimmed[trimmed.length - 1];
    if (!last || last.role !== "user" || !last.content.trim()) throw new ValidationError("Escribe tu pregunta.", "message");

    const perfumes = await this.catalog.execute({});
    const text = await this.assistant.reply({ history: trimmed, catalog: this.describe(perfumes), storeName: this.storeName });
    return { text, mentionedIds: this.mentioned(text, perfumes) };
  }

  private describe(perfumes: PerfumeDTO[]): string {
    return perfumes
      .map((p) => {
        const options = p.presentations.map((v) => `${v.ml} ml ${v.typeLabel} ${v.priceLabel}${v.inStock ? "" : " (agotado)"}`).join("; ");
        return `- ${p.name} | ${p.house} | ${p.categoryLabel} | ${p.genderLabel} | ${p.concentrationLabel} | Notas: ${[p.notes.top, p.notes.heart, p.notes.base].filter(Boolean).join(" / ")} | ${p.description} | Presentaciones: ${options}`;
      })
      .join("\n");
  }

  private mentioned(text: string, perfumes: PerfumeDTO[]): string[] {
    const normalized = text.toLowerCase();
    return perfumes.filter((p) => p.name.length > 2 && normalized.includes(p.name.toLowerCase())).slice(0, 4).map((p) => p.id);
  }
}
