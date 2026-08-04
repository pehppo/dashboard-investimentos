import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioSnapshot, PortfolioSnapshot } from "@/lib/actions/chat";
import { generateChatReply, GeminiMessage } from "@/lib/external/gemini";
import { formatBRL } from "@/lib/format";

const SYSTEM_PROMPT_RULES = `Você ajuda o usuário a decidir como alocar um novo aporte na carteira de investimentos dele.

Regras:
1. Só pode sugerir reforçar ativos que o usuário JÁ possui (listados abaixo). Nunca sugira comprar um ticker, emissor ou produto que não esteja nessa lista — isso seria recomendação de investimento não licenciada.
2. Se o usuário informar uma proporção-alvo entre Renda Variável e Renda Fixa, calcule quanto do aporte alocar em cada classe pra aproximar dessa meta. Se ele não informar, pergunte ou explique de forma neutra e educativa, sem prescrever um número como certo pra ele.
3. Deixe claro que isso é uma ferramenta de apoio matemático e organização, não uma recomendação de investimento formal/regulada.
4. Responda em português, de forma direta e objetiva.`;

function buildSystemPrompt(snapshot: PortfolioSnapshot): string {
  const rvLines = snapshot.rendaVariavel.posicoes.length
    ? snapshot.rendaVariavel.posicoes
        .map(
          (p) =>
            `- ${p.ticker} (${p.tipo}): ${p.quantidade} un., preço médio ${formatBRL(p.precoMedio)}, valor atual ${formatBRL(p.valorAtual)}`,
        )
        .join("\n")
    : "(nenhuma posição aberta)";

  const rfLines = snapshot.rendaFixa.posicoes.length
    ? snapshot.rendaFixa.posicoes
        .map(
          (p) =>
            `- ${p.emissor} (${p.produto}, ${p.indexador}): valor investido ${formatBRL(p.valorInvestido)}${
              p.vencimento ? `, vencimento ${p.vencimento}` : ""
            }`,
        )
        .join("\n")
    : "(nenhuma posição aberta)";

  return `${SYSTEM_PROMPT_RULES}

Carteira atual do usuário:
Patrimônio total: ${formatBRL(snapshot.totalInvestido)}
Renda Variável — investido: ${formatBRL(snapshot.rendaVariavel.totalInvestido)}, valor atual: ${formatBRL(snapshot.rendaVariavel.totalAtual)}
${rvLines}
Renda Fixa — investido: ${formatBRL(snapshot.rendaFixa.totalInvestido)}
${rfLines}`;
}

interface ChatRequestBody {
  messages?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "Nenhuma mensagem enviada" }, { status: 400 });
  }

  const snapshot = await getPortfolioSnapshot();
  const systemPrompt = buildSystemPrompt(snapshot);

  const geminiMessages: GeminiMessage[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    content: m.content,
  }));

  try {
    const reply = await generateChatReply(systemPrompt, geminiMessages);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("chat route: falha ao gerar resposta", err);
    return NextResponse.json(
      { error: "Não foi possível gerar uma recomendação agora. Tente novamente em instantes." },
      { status: 502 },
    );
  }
}
