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
    <div className="min-h-screen bg-[#efe8da] text-stone-800 dark:bg-stone-950 dark:text-stone-100">
      <div className="lava-bg">
        <div className="lava-blob lava-1" />
        <div className="lava-blob lava-2" />
        <div className="lava-blob lava-3" />
        <div className="lava-blob lava-4" />
      </div>

      <div className="relative z-10">
        {/* Navegação */}
        <nav className="max-w-5xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <Scroll size={26} className="text-amber-700 dark:text-amber-500" />
            <span className="font-bold text-amber-900 dark:text-amber-100 text-xl">
              HistoryAI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle className="w-9 h-9" />
            <Link
              to={loggedIn ? "/chat" : "/login"}
              className="text-sm font-medium text-stone-600 hover:text-stone-800 dark:text-stone-300 dark:hover:text-stone-100 transition-colors"
            >
              {loggedIn ? "Abrir chat" : "Entrar"}
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <header className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-amber-900 dark:text-amber-100 leading-tight">
            E se a história tivesse
            <br />
            sido diferente?
          </h1>
          <p className="mt-6 text-lg md:text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
            O HistoryAI é um chatbot especialista em <strong>história contrafactual</strong>:
            explore cenários hipotéticos, estude os fatos reais e entenda as forças
            que moldaram (ou poderiam ter moldado) o mundo.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={ctaTarget}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-semibold px-8 py-3.5 text-lg shadow-lg shadow-amber-900/20 transition-colors"
            >
              Testar agora <ArrowRight size={20} />
            </Link>
            {!loggedIn && (
              <Link
                to="/login"
                className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 underline underline-offset-4 transition-colors"
              >
                Já tenho conta
              </Link>
            )}
          </div>
        </header>

        {/* Exemplos */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="flex flex-wrap justify-center gap-3">
            {EXAMPLES.map((e) => (
              <span
                key={e}
                className="text-sm rounded-full border border-amber-600/25 bg-white/60 px-4 py-2 text-stone-600 dark:bg-stone-900/60 dark:border-amber-700/30 dark:text-stone-300"
              >
                {e}
              </span>
            ))}
          </div>
        </section>

        {/* Funcionalidades */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-stone-400/25 bg-white/70 p-6 dark:bg-stone-900/70 dark:border-stone-700/40"
              >
                <Icon size={26} className="text-amber-700 dark:text-amber-500 mb-3" />
                <h3 className="font-semibold text-lg text-stone-800 dark:text-stone-100 mb-1.5">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-amber-900 dark:text-amber-100 mb-4">
            História como você nunca estudou
          </h2>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            A cada cenário, o HistoryAI apresenta primeiro um <strong>resumo do fato
            histórico real</strong> e do ponto exato de divergência — só então especula as
            consequências, sempre separando o que é documentado do que é hipótese
            plausível. E ao final, propõe novas perguntas para você continuar
            aprendendo.
          </p>
          <Link
            to={ctaTarget}
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-amber-600/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 dark:border-amber-700/40 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 font-semibold px-6 py-3 transition-colors"
          >
            Começar a explorar <ArrowRight size={18} />
          </Link>
        </section>

        {/* Rodapé */}
        <footer className="border-t border-stone-400/20 dark:border-stone-700/30 py-6 text-center text-sm text-stone-400 dark:text-stone-500">
          HistoryAI — estudo de história com inteligência artificial
        </footer>
      </div>
    </div>
  );
}
