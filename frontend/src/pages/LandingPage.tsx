import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  MessagesSquare,
  Scroll,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import LavaBackground from "../components/LavaBackground";
import { ButtonLink } from "../components/ui/Button";
import { getToken } from "../lib/auth";

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
  const loggedIn = Boolean(getToken());
  const ctaTarget = loggedIn ? "/chat" : "/registro";

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <LavaBackground />

      <div className="relative z-10">
        <nav
          aria-label="Principal"
          className="max-w-5xl mx-auto flex items-center justify-between px-6 py-5"
        >
          <span className="flex items-center gap-2">
            <Scroll size={24} className="text-accent" aria-hidden="true" />
            <span className="font-display font-semibold tracking-widest text-accent">
              HISTORYAI
            </span>
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to={loggedIn ? "/chat" : "/login"}
              className="inline-flex items-center min-h-11 px-3 font-semibold text-ink-muted hover:text-ink transition-colors duration-200"
            >
              {loggedIn ? "Abrir chat" : "Entrar"}
            </Link>
          </div>
        </nav>

        <main id="conteudo">
          {/* Hero */}
          <header className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
            <h1 className="text-5xl md:text-7xl font-semibold text-accent leading-[1.05]">
              E se a história tivesse
              <br />
              sido diferente?
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink-muted max-w-2xl mx-auto leading-relaxed">
              O HistoryAI é um chatbot especialista em{" "}
              <strong className="text-ink font-semibold">
                história contrafactual
              </strong>
              : explore cenários hipotéticos, estude os fatos reais e entenda as
              forças que moldaram (ou poderiam ter moldado) o mundo.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <ButtonLink to={ctaTarget} size="lg" className="shadow-lg shadow-black/10">
                Testar agora <ArrowRight size={20} aria-hidden="true" />
              </ButtonLink>
              {!loggedIn && (
                <Link
                  to="/login"
                  className="inline-flex items-center min-h-11 px-3 text-ink-muted hover:text-ink underline underline-offset-4 transition-colors duration-200"
                >
                  Já tenho conta
                </Link>
              )}
            </div>
          </header>

          {/* Exemplos */}
          <section aria-label="Exemplos de perguntas" className="max-w-4xl mx-auto px-6 pb-16">
            <ul className="flex flex-wrap justify-center gap-3">
              {EXAMPLES.map((e) => (
                <li
                  key={e}
                  className="text-sm rounded-full border border-accent-line bg-surface-raised px-4 py-2 text-ink-muted"
                >
                  {e}
                </li>
              ))}
            </ul>
          </section>

          {/* Funcionalidades */}
          <section aria-labelledby="recursos" className="max-w-5xl mx-auto px-6 pb-20">
            <h2 id="recursos" className="sr-only">
              Recursos
            </h2>
            <ul className="grid sm:grid-cols-2 gap-5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="rounded-2xl border border-subtle bg-surface-raised p-6"
                >
                  <Icon size={26} className="text-accent mb-3" aria-hidden="true" />
                  <h3 className="font-semibold text-xl mb-1.5">{title}</h3>
                  <p className="text-ink-muted leading-relaxed">{text}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Como funciona */}
          <section
            aria-labelledby="como-funciona"
            className="max-w-3xl mx-auto px-6 pb-20 text-center"
          >
            <h2
              id="como-funciona"
              className="text-3xl md:text-4xl font-semibold text-accent mb-4"
            >
              História como você nunca estudou
            </h2>
            <p className="text-ink-muted leading-relaxed">
              A cada cenário, o HistoryAI apresenta primeiro um{" "}
              <strong className="text-ink font-semibold">
                resumo do fato histórico real
              </strong>{" "}
              e do ponto exato de divergência — só então especula as
              consequências, sempre separando o que é documentado do que é
              hipótese plausível. E ao final, propõe novas perguntas para você
              continuar aprendendo.
            </p>
            <ButtonLink to={ctaTarget} variant="secondary" className="mt-8">
              Começar a explorar <ArrowRight size={18} aria-hidden="true" />
            </ButtonLink>
          </section>
        </main>

        <footer className="border-t border-subtle py-6 text-center text-sm text-ink-subtle">
          HistoryAI — estudo de história com inteligência artificial
        </footer>
      </div>
    </div>
  );
}
