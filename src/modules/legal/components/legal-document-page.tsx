import Link from "next/link";

import StandardHeader from "@/components/ui/StandardHeader";
import FooterContact from "@/components/ui/FooterContact";

interface LegalSection {
  title: string;
  paragraphs: string[];
}

interface LegalDocumentPageProps {
  title: string;
  description: string;
  version: string;
  sections: LegalSection[];
  activeDocument: "general" | "tech" | "tech-contract" | "online" | "privacy";
}

const documents = [
  { id: "general", label: "Termos Gerais", href: "/termos" },
  { id: "tech", label: "Termos Tech", href: "/termos/tech" },
  {
    id: "tech-contract",
    label: "Contratacao Tech",
    href: "/termos/tech/contratacao",
  },
  { id: "online", label: "Termos Online", href: "/termos/online" },
  { id: "privacy", label: "Privacidade", href: "/privacidade" },
] as const;

export function LegalDocumentPage({
  title,
  description,
  version,
  sections,
  activeDocument,
}: LegalDocumentPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <StandardHeader />
      <main className="mx-auto max-w-5xl px-5 pb-20 pt-28 sm:px-8 lg:pt-32">
        <nav
          aria-label="Documentos legais"
          className="mb-10 flex flex-wrap gap-x-5 gap-y-3 border-b border-white/10 pb-5"
        >
          {documents.map((document) => (
            <Link
              key={document.id}
              href={document.href}
              aria-current={activeDocument === document.id ? "page" : undefined}
              className={`text-sm font-medium transition-colors ${
                activeDocument === document.id
                  ? "text-[#d73cbe]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {document.label}
            </Link>
          ))}
        </nav>

        <header className="max-w-3xl border-b border-white/10 pb-10">
          <p className="text-xs font-bold uppercase text-[#d73cbe]">
            Versao {version}
          </p>
          <h1 className="mt-3 font-futura text-3xl font-bold uppercase sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
            {description}
          </p>
        </header>

        <div className="mt-10 max-w-3xl space-y-10">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-7 text-slate-300"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <FooterContact />
    </div>
  );
}
