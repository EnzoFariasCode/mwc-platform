export default function TesteCoresPage() {
  return (
    <div className="min-h-screen p-10 space-y-10 bg-black text-white">
      <h1 className="text-3xl font-bold">Diagnóstico de Cores</h1>

      {/* TESTE 1: Variável CSS Pura (Sem Tailwind) */}
      <section>
        <h2 className="text-xl mb-4 text-gray-400">
          1. Teste de Variável CSS Nativa
        </h2>
        <p className="mb-2">
          Se o quadrado abaixo estiver{" "}
          <span style={{ color: "var(--primary)" }}>ROXO</span>, o arquivo
          globals.css está carregando.
        </p>
        <p className="mb-2">
          Se estiver BRANCO ou TRANSPARENTE, o globals.css NÃO está sendo
          importado.
        </p>
        <div
          style={{
            backgroundColor: "var(--primary)",
            width: "100px",
            height: "100px",
            border: "2px solid white",
          }}
          className="flex items-center justify-center font-bold"
        >
          CSS
        </div>
      </section>

      {/* TESTE 2: Classe Tailwind */}
      <section>
        <h2 className="text-xl mb-4 text-gray-400">
          2. Teste de Classe Tailwind
        </h2>
        <p className="mb-2">
          Se o quadrado abaixo estiver ROXO, o tailwind.config.ts está
          configurado certo.
        </p>
        <div className="w-[100px] h-[100px] bg-primary border-2 border-white flex items-center justify-center font-bold">
          TW
        </div>
      </section>
    </div>
  );
}
