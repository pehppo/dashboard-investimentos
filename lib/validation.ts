import { z } from "zod";

export const rendaVariavelTransactionSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1, "Informe o ticker")
    .max(10, "Ticker inválido")
    .transform((v) => v.toUpperCase()),
  rv_type: z.enum(["acao", "fii", "etf", "bdr"]),
  tx_type: z.enum(["compra", "venda"]),
  tx_date: z.string().min(1, "Informe a data"),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  unit_price: z.coerce.number().positive("Preço deve ser maior que zero"),
  fees: z.coerce.number().min(0, "Taxas não podem ser negativas").default(0),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type RendaVariavelTransactionInput = z.infer<
  typeof rendaVariavelTransactionSchema
>;

// Edição de transação: ticker/tipo do ativo não mudam (pertencem ao ativo, não à transação)
export const editRendaVariavelTransactionSchema = rendaVariavelTransactionSchema.omit({
  ticker: true,
  rv_type: true,
});

export type EditRendaVariavelTransactionInput = z.infer<
  typeof editRendaVariavelTransactionSchema
>;

export const proventoSchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  tx_date: z.string().min(1, "Informe a data"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ProventoInput = z.infer<typeof proventoSchema>;

export const rendaFixaAssetSchema = z.object({
  issuer: z.string().trim().min(1, "Informe o emissor"),
  rf_product: z.enum(["CDB", "Tesouro Direto", "LCI", "LCA"]),
  indexador: z.enum(["cdi_pct", "ipca_mais", "prefixado", "selic_pct"]),
  indexador_rate_pct: z.coerce
    .number()
    .positive("Taxa deve ser maior que zero"),
  principal_amount: z.coerce
    .number()
    .positive("Valor investido deve ser maior que zero"),
  purchase_date: z.string().min(1, "Informe a data de compra"),
  maturity_date: z.string().min(1, "Informe a data de vencimento"),
});

export type RendaFixaAssetInput = z.infer<typeof rendaFixaAssetSchema>;

export const grantShareSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
});

export type GrantShareInput = z.infer<typeof grantShareSchema>;

export const signUpSchema = z
  .object({
    email: z.string().trim().email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});
