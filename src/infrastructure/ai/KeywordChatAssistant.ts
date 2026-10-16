import type { ChatAssistant, ChatMessage } from "@/core/application/ports/services";

/**
 * Asesor sin IA: busca coincidencias por palabras en el catálogo.
 * Se usa cuando no hay ANTHROPIC_API_KEY configurada, para que el chat nunca quede inservible.
 */
export class KeywordChatAssistant implements ChatAssistant {
  async reply({ history, catalog }: { history: ChatMessage[]; catalog: string; storeName: string }): Promise<string> {
    const question = this.normalize(history[history.length - 1]?.content ?? "");
    const entries = catalog.split("\n").filter(Boolean);
    const words = question.split(/[^a-z0-9.]+/).filter((w) => w.length > 3);

    const scored = entries
      .map((line) => {
        const hay = this.normalize(line);
        const name = this.normalize(line.slice(2, line.indexOf(" | ")));
        const score = (question.includes(name) ? 10 : 0) + words.reduce((s, w) => s + (hay.includes(w.replace(/s$/, "")) ? 1 : 0), 0);
        return { line, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (scored.length === 0) {
      return "No encontré ese perfume en nuestro catálogo. Escríbeme el nombre o la casa (por ejemplo Sauvage, Lattafa o Creed), o cuéntame qué notas te gustan.";
    }
    return ["Esto encontré en nuestro catálogo:", ...scored.map(({ line }) => this.summarize(line))].join("\n");
  }

  private summarize(line: string): string {
    const [name, house, , , , , , presentations] = line.slice(2).split(" | ");
    return `• ${name} de ${house} — ${presentations?.replace("Presentaciones: ", "") ?? ""}`;
  }

  private normalize(text: string): string {
    return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
}
