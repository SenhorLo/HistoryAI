import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scroll } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { login, register } from "../lib/api";
import { saveSession } from "../lib/auth";

interface Props {
  mode: "login" | "register";
}

export default function AuthPage({ mode }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const result = isLogin
        ? await login(email, password)
        : await register(email, password);
      saveSession(result.token, result.email);
      navigate("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#efe8da] dark:bg-stone-950 flex items-center justify-center px-4">
      <div className="lava-bg">
        <div className="lava-blob lava-1" />
        <div className="lava-blob lava-2" />
        <div className="lava-blob lava-3" />
      </div>
      <ThemeToggle className="absolute top-4 right-4 w-9 h-9 z-20" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Scroll
            size={48}
            className="mx-auto mb-3 text-amber-600"
            strokeWidth={1.5}
          />
          <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
            HistoryAI
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2">
            E se a história tivesse sido diferente?
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/70 border border-stone-400/25 dark:bg-stone-900/70 dark:border-stone-700/40 rounded-2xl p-8 shadow-xl"
        >
          <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-6">
            {isLogin ? "Entrar" : "Criar conta"}
          </h2>

          <label className="block mb-4">
            <span className="text-sm text-stone-600 dark:text-stone-300">
              E-mail
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/60 border border-stone-400/30 text-stone-800 placeholder-stone-400 dark:bg-stone-800/70 dark:border-stone-700 dark:text-stone-100 dark:placeholder-stone-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600/60"
              placeholder="voce@exemplo.com"
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm text-stone-600 dark:text-stone-300">
              Senha
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/60 border border-stone-400/30 text-stone-800 placeholder-stone-400 dark:bg-stone-800/70 dark:border-stone-700 dark:text-stone-100 dark:placeholder-stone-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600/60"
              placeholder="Mínimo de 6 caracteres"
            />
          </label>

          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-100 border border-red-300 dark:text-red-400 dark:bg-red-950/40 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2.5 transition-colors"
          >
            {loading ? "Aguarde..." : isLogin ? "Entrar" : "Cadastrar"}
          </button>

          <p className="mt-5 text-sm text-stone-500 dark:text-stone-400 text-center">
            {isLogin ? (
              <>
                Não tem conta?{" "}
                <Link
                  to="/registro"
                  className="text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Cadastre-se
                </Link>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <Link
                  to="/login"
                  className="text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Entrar
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
