import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita colisão com o botão flutuante de "Lançar investimento" (bottom-right).
  devIndicators: {
    position: "top-left",
  },
};

export default nextConfig;
