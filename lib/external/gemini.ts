// Alias "latest" em vez de fixar uma versão (ex.: "gemini-2.5-flash") — nomes
// de versão específica saem de disponibilidade pra contas novas com frequência
// (confirmado durante a implementação: "gemini-2.5-flash" já retornava 404).
const GEMINI_MODEL = "gemini-flash-latest";

export interface GeminiMessage {
  role: "user" | "model";
  content: string;
}

export async function generateChatReply(
  systemInstruction: string,
  messages: GeminiMessage[],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Gemini respondeu ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini não retornou texto na resposta");
  }

  return text;
}
