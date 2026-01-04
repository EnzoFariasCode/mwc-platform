import type { Metadata } from "next";
import { Poppins, Orbitron } from "next/font/google"; // 1. Importando as fontes certas
import "./globals.css";

// 2. Configurando a Poppins (Texto Padrão)
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins", // Nome da variável que o Tailwind espera
});

// 3. Configurando a Orbitron (Títulos Futuristas)
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-orbitron", // Nome da variável que o Tailwind espera
});

export const metadata: Metadata = {
  title: "MWC Platform",
  description: "Marketplace de Serviços Profissionais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* 4. Injetando as variáveis no Body + classes base */}
      <body
        // MUDANÇA AQUI: Adicionei ${poppins.className} diretamente
        // Isso aplica a fonte direto no CSS, sem depender do Tailwind achar a variável
        className={`${poppins.className} ${orbitron.variable} antialiased bg-slate-950 text-slate-50`}
      >
        {children}
      </body>
    </html>
  );
}