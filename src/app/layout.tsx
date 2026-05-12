import type { Metadata } from "next";
import { Poppins, Orbitron } from "next/font/google";
import { Toaster } from "sonner"; // <--- 1. IMPORTANTE: Importar aqui
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "MWC Platform",
  description: "Marketplace de Serviços Profissionais",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        suppressHydrationWarning={true}
        className={`${poppins.className} ${orbitron.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <AuthProvider>{children}</AuthProvider>

        {/* 2. ADICIONE ISSO AQUI (Fora do children, mas dentro do body) */}
        <Toaster richColors theme="dark" position="top-center" closeButton />
      </body>
    </html>
  );
}
