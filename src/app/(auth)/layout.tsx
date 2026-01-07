import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/images/landingPage/logo.png";
import bgLogin from "@/assets/images/login/bg-login.jpg";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {/* --- LADO ESQUERDO (Fixo) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full bg-card border-r border-border">
        <div
          className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: `url(${bgLogin.src})` }}
        />

        {/* Gradiente de sobreposição agora usa variáveis HSL para melhor fusão */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background/90 to-background z-10" />

        {/* Glows */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] z-10" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] z-10" />

        <div className="relative z-20 flex flex-col justify-between p-16 h-full text-foreground">
          <div>
            <Link
              href="/"
              className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity"
            >
              <Image
                src={Logo}
                alt="MWC"
                className="h-10 w-auto object-contain"
              />
              <span className="font-futura font-bold text-xl tracking-wider pt-1">
                MWC
              </span>
            </Link>
          </div>

          <div className="space-y-6 max-w-lg">
            <h2 className="text-5xl font-bold font-futura leading-tight drop-shadow-lg">
              A plataforma definitiva para <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
                grandes profissionais.
              </span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed drop-shadow-md font-medium">
              Junte-se a milhares de especialistas e clientes em um ambiente
              seguro, moderno e eficiente.
            </p>
          </div>

          <div className="text-sm text-muted-foreground font-medium">
            © {new Date().getFullYear()} Maximum World Click. Todos os direitos
            reservados.
          </div>
        </div>
      </div>

      {/* --- LADO DIREITO (Com Scroll Independente) --- */}
      <div className="flex-1 h-full overflow-y-auto bg-background relative">
        <div className="flex flex-col justify-center items-center min-h-full p-4 sm:p-12 lg:p-24">
          {/* Botão Voltar */}
          <div className="absolute top-6 left-6 lg:hidden z-20">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 font-medium text-sm"
            >
              ← Voltar para Home
            </Link>
          </div>

          <div className="w-full max-w-md space-y-8 relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
