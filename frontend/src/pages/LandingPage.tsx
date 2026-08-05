import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  GitBranch,
  MessagesSquare,
  PenTool,
  Scroll,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import LavaBackground from "../components/LavaBackground";
import HeroSparks from "../components/HeroSparks";
import Logo from "../components/ui/Logo";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useFramesAreRunning } from "../hooks/useFramesAreRunning";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { getToken } from "../lib/auth";
import { cn } from "../lib/cn";

/** Atraso de entrada de um bloco do hero, lido pelo CSS. */
const enter = (ms: number) => ({ "--enter-delay": `${ms}ms` }) as CSSProperties;

/** Selo do método, logo abaixo do eyebrow. */
const HERO_META = [
  { icon: BookOpen, label: "Fato documentado" },
  { icon: GitBranch, label: "Ponto de divergência" },
  { icon: Scroll, label: "Historiografia" },
];

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
  /*
    Mesma trava do `.is-rising` do chat: a classe de entrada só entra depois
    de vermos um quadro chegar. Sem quadros — aba em segundo plano, contexto
    sem composição — o hero fica direto no estado final, em vez de preso em
    opacity 0 e invisível para sempre.
  */
  const entering = useFramesAreRunning();
  /*
    Vídeo que se move sozinho por mais de 5 segundos é exatamente o caso do
    WCAG 2.2.2. Quem pediu menos movimento não recebe o vídeo: cai no fundo
    de blobs, que o CSS já congela. Não é só trocar autoPlay por false —
    parado, o <video> mostraria um retângulo preto até decodificar o
    primeiro quadro.
  */
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <div ref={scope} className="min-h-dvh bg-surface text-ink">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>

      {reduceMotion ? (
        <LavaBackground />
      ) : (
        <video
          className="hero-video"
          src="/fundo-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          // decorativo: o conteúdo da página não depende dele
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      {/* textura de papel sobre a página inteira; puramente decorativa */}
      <div className="paper-grain" aria-hidden="true" />

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
              className="ui-text liquid-glass inline-flex items-center min-h-11 px-5 rounded-full text-accent font-semibold transition-colors duration-200"
            >
              {loggedIn ? "Abrir chat" : "Entrar"}
            </Link>
          </div>
        </nav>

        <main id="conteudo">
          {/* Hero */}
          {/*
            Hero cinematográfico: ocupa a viewport menos a altura da nav
            (44px de alvo + 40px de padding = 5.25rem) e ancora o conteúdo
            embaixo. O espaço vazio em cima é o que deixa o fundo animado
            respirar, e o texto baixo sinaliza que a página continua.
          */}
          <header className="relative flex min-h-[calc(100dvh-5.25rem)] flex-col justify-end overflow-hidden px-6 pb-14 md:pb-20">
            <HeroSparks />
            <div className="hero-veil" aria-hidden="true" />

            <div
              className={cn(
                "relative max-w-6xl mx-auto w-full",
                entering && "is-entering",
              )}
            >
              <p
                data-enter
                style={enter(300)}
                className="section-label text-accent"
              >
                História contrafactual · Rigor acadêmico
              </p>
              <div
                data-ink-draw
                style={enter(380)}
                className="hairline w-16 mt-2.5 mb-6"
                aria-hidden="true"
              />

              <ul
                data-enter
                style={enter(440)}
                className="ui-text flex flex-wrap gap-x-6 gap-y-2 mb-7 text-[11px] tracking-[0.22em] uppercase text-ink-subtle"
              >
                {HERO_META.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2">
                    <Icon size={14} className="text-accent" aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>

              <h1
                data-enter
                style={enter(520)}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.02] tracking-tight max-w-4xl"
              >
                <span className="block">E se a história tivesse</span>
                {/* o gradiente é recortado no texto; em modo de alto
                    contraste o CSS devolve a cor sólida */}
                <span className="block gild">sido diferente?</span>
              </h1>

              <p
                data-enter
                style={enter(640)}
                className="mt-6 text-lg md:text-xl text-ink-muted max-w-2xl leading-relaxed"
              >
                O HistoryAI explora cenários hipotéticos com rigor acadêmico:
                parte do fato documentado, identifica o ponto de divergência e
                separa sempre o que é história do que é especulação.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  to={ctaTarget}
                  data-enter
                  style={enter(740)}
                  className="ui-text cta-gradient inline-flex items-center gap-2 min-h-11 rounded-full px-7 sm:px-8 py-3.5 text-base sm:text-lg font-bold shadow-lg shadow-black/20 transition-all duration-200 hover:shadow-xl"
                >
                  {loggedIn ? "Abrir meu chat" : "Começar de graça"}
                  <ArrowDownRight size={20} aria-hidden="true" />
                </Link>

                <a
                  href="#exemplos"
                  data-enter
                  style={enter(840)}
                  className="ui-text liquid-glass inline-flex items-center gap-2 min-h-11 rounded-full px-7 sm:px-8 py-3.5 text-base font-semibold text-ink transition-colors duration-200"
                >
                  Ver exemplos
                  <ArrowRight size={16} aria-hidden="true" />
                </a>

                {!loggedIn && (
                  <Link
                    to="/login"
                    data-enter
                    style={enter(900)}
                    className="ui-text inline-flex items-center min-h-11 px-3 text-sm text-ink-muted hover:text-ink underline underline-offset-4 transition-colors duration-200"
                  >
                    Já tenho conta
                  </Link>
                )}
              </div>

              <p
                data-enter
                style={enter(980)}
                className="ui-text mt-10 flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-ink-subtle"
              >
                <PenTool size={12} className="text-accent" aria-hidden="true" />
                Separa fato de especulação
              </p>
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
            <div className="hairline w-16 mx-auto mt-2.5" aria-hidden="true" />
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
                  className="liquid-glass rounded-card p-6 hover:bg-surface-raised transition-colors duration-200"
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
            <div className="hairline w-16 mx-auto mt-2.5" aria-hidden="true" />
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
            <div className="hairline w-16 mx-auto mt-2.5" aria-hidden="true" />
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
                  className="liquid-glass text-sm rounded-full px-4 py-2.5 text-ink-muted"
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
