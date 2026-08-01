import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  MessagesSquare,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import LavaBackground from "../components/LavaBackground";
import HeroSparks from "../components/HeroSparks";
import Logo from "../components/ui/Logo";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { getToken } from "../lib/auth";

/** Links do menu — todos apontam para seções que existem nesta página. */
const NAV_LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#exemplos", label: "Exemplos" },
];

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Cenários contrafactuais",
    text: "Proponha qualquer 'E se...?' — a IA contextualiza o fato real, identifica o ponto de divergência e desenvolve as consequências plausíveis.",
  },
  {
    icon: Brain,
    title: "Múltiplas lentes de análise",
    text: "Cada cenário é examinado pela política, economia, filosofia, sociologia e teologia — como um seminário de história ao seu alcance.",
  },
  {
    icon: BookOpen,
    title: "Memória de estudos",
    text: "Suas conversas ficam salvas. Retome uma linha de raciocínio dias depois exatamente de onde parou.",
  },
  {
    icon: FileText,
    title: "PDFs e slides sob demanda",
    text: "Peça no chat e receba um documento PDF ou uma apresentação de slides pronta para baixar sobre o assunto estudado.",
  },
];

const EXAMPLES = [
  "E se a Alemanha tivesse vencido a Segunda Guerra Mundial?",
  "E se Jesus não tivesse sido crucificado?",
  "E se Sócrates tivesse morrido na Guerra do Peloponeso?",
  "E se o Império Romano nunca tivesse caído?",
];

export default function LandingPage() {
  const scope = useScrollReveal<HTMLDivElement>();
  const loggedIn = Boolean(getToken());
  const ctaTarget = loggedIn ? "/chat" : "/registro";

  return (
    <div ref={scope} className="min-h-dvh bg-surface text-ink">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <LavaBackground />

      <div className="relative z-10">
        <nav
          aria-label="Principal"
          className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-5"
        >
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 min-h-11"
            aria-label="HistoryAI, início"
          >
            <Logo size="sm" />
          </Link>

          {/* menu central — escondido no mobile, onde a página é curta o
              bastante para rolar direto */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  className="ui-text inline-flex items-center min-h-11 px-3 text-sm font-medium text-ink-muted hover:text-accent transition-colors duration-200"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <Link
              to={loggedIn ? "/chat" : "/login"}
              className="ui-text inline-flex items-center min-h-11 px-5 rounded-full border border-accent-line text-accent font-semibold hover:bg-accent-wash transition-colors duration-200"
            >
              {loggedIn ? "Abrir chat" : "Entrar"}
            </Link>
          </div>
        </nav>

        <main id="conteudo">
          {/* Hero */}
          <header className="relative max-w-4xl mx-auto text-center px-6 pt-20 pb-24">
            <HeroSparks />

            <div className="relative" data-reveal-hero>
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
                E se a história tivesse{" "}
                <span className="text-accent">sido diferente?</span>
              </h1>
              <p className="mt-7 text-lg md:text-xl text-ink-muted max-w-2xl mx-auto leading-relaxed">
                O HistoryAI explora cenários hipotéticos com rigor acadêmico:
                parte do fato documentado, identifica o ponto de divergência e
                separa sempre o que é história do que é especulação.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4">
                <Link
                  to={ctaTarget}
                  className="ui-text cta-gradient inline-flex items-center gap-2 min-h-11 rounded-full px-8 py-4 text-lg font-bold shadow-lg shadow-black/20 transition-all duration-200 hover:shadow-xl"
                >
                  {loggedIn ? "Abrir meu chat" : "Começar de graça"}
                  <ArrowDownRight size={20} aria-hidden="true" />
                </Link>
                {!loggedIn && (
                  <Link
                    to="/login"
                    className="ui-text inline-flex items-center min-h-11 px-3 text-sm text-ink-muted hover:text-ink underline underline-offset-4 transition-colors duration-200"
                  >
                    Já tenho conta
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* Recursos */}
          <section
            id="recursos"
            aria-labelledby="recursos-titulo"
            className="max-w-5xl mx-auto px-6 py-16 scroll-mt-8"
          >
            <p className="section-label text-accent text-center" data-reveal>
              Recursos
            </p>
            <h2
              id="recursos-titulo"
              className="mt-2 mb-10 text-3xl md:text-4xl font-bold text-center"
              data-reveal
            >
              Um seminário de história ao seu alcance
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4" data-reveal-stagger>
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="rounded-card border border-subtle bg-surface-raised p-6 hover:border-accent-line transition-colors duration-200"
                >
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-accent-wash border border-accent-line mb-4">
                    <Icon size={20} className="text-accent" aria-hidden="true" />
                  </span>
                  <h3 className="font-bold text-lg mb-1.5">{title}</h3>
                  <p className="text-ink-muted leading-relaxed">{text}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Como funciona */}
          <section
            id="como-funciona"
            aria-labelledby="como-titulo"
            className="max-w-3xl mx-auto px-6 py-16 text-center scroll-mt-8"
          >
            <p className="section-label text-accent" data-reveal>
              Como funciona
            </p>
            <h2
              id="como-titulo"
              className="mt-2 text-3xl md:text-4xl font-bold text-accent mb-5"
              data-reveal
            >
              História como você nunca estudou
            </h2>
            <p className="text-ink-muted leading-relaxed text-lg" data-reveal>
              A cada cenário, o HistoryAI apresenta primeiro um{" "}
              <strong className="text-ink font-bold">
                resumo do fato histórico real
              </strong>{" "}
              e do ponto exato de divergência — só então especula as
              consequências, sempre separando o que é documentado do que é
              hipótese plausível. E ao final, propõe novas perguntas para você
              continuar aprendendo.
            </p>
          </section>

          {/* Exemplos */}
          <section
            id="exemplos"
            aria-labelledby="exemplos-titulo"
            className="max-w-4xl mx-auto px-6 py-16 scroll-mt-8"
          >
            <p className="section-label text-accent text-center" data-reveal>
              Exemplos
            </p>
            <h2
              id="exemplos-titulo"
              className="mt-2 mb-8 text-3xl md:text-4xl font-bold text-center"
              data-reveal
            >
              Por onde começar
            </h2>
            <ul className="flex flex-wrap justify-center gap-3" data-reveal-stagger>
              {EXAMPLES.map((e) => (
                <li
                  key={e}
                  className="text-sm rounded-full border border-accent-line bg-surface-raised px-4 py-2.5 text-ink-muted"
                >
                  {e}
                </li>
              ))}
            </ul>

            <div className="mt-12 text-center" data-reveal>
              <Link
                to={ctaTarget}
                className="ui-text cta-gradient inline-flex items-center gap-2 min-h-11 rounded-full px-8 py-4 font-bold shadow-lg shadow-black/20 transition-all duration-200 hover:shadow-xl"
              >
                Começar a explorar
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-subtle mt-8 py-8 text-center">
          <p className="ui-text text-sm text-ink-subtle">
            HistoryAI — estudo de história com inteligência artificial
          </p>
        </footer>
      </div>
    </div>
  );
}
