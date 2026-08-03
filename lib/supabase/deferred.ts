import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente para uso dentro de `after()` — lá não é permitido ler cookies (Next.js
// não suporta), então recebe o access_token já extraído antes do after() rodar,
// em vez de tentar reconstruir a sessão via cookies como o cliente normal faz.
export function createDeferredClient(accessToken?: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : undefined,
  );
}
