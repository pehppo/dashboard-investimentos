import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Indicador de dev do Next.js desativado: sem uso pra nós e colidia com o
  // botão flutuante de "Lançar investimento" (bottom-right).
  devIndicators: false,
};

export default nextConfig;
