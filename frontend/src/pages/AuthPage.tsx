import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scroll } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import LavaBackground from "../components/LavaBackground";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Alert } from "../components/ui/Alert";
import { login, register } from "../lib/api";
import { saveSession } from "../lib/auth";

interface Props {
  mode: "login" | "register";
}

const MIN_PASSWORD = 6;

export default function AuthPage({ mode }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPasswordError(null);

    if (password.length < MIN_PASSWORD) {
      // erro fica no campo, não só num bloco no topo do formulário
      setPasswordError(`A senha deve ter no mínimo ${MIN_PASSWORD} caracteres.`);
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
    <div className="min-h-dvh bg-surface text-ink flex items-center justify-center px-4 py-10">
      <LavaBackground />
      <ThemeToggle className="absolute top-4 right-4 z-20" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Scroll
            size={48}
            className="mx-auto mb-3 text-accent"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="overline text-accent">HistoryAI</p>
          <h1 className="text-3xl font-semibold text-accent mt-1">
            E se a história tivesse sido diferente?
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-surface-raised border border-subtle rounded-2xl p-8 shadow-xl"
        >
          <h2 className="text-2xl font-semibold mb-6">
            {isLogin ? "Entrar" : "Criar conta"}
          </h2>

          <Field
            label="E-mail"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />

          <Field
            label="Senha"
            type="password"
            required
            minLength={MIN_PASSWORD}
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            hint={isLogin ? undefined : `Mínimo de ${MIN_PASSWORD} caracteres.`}
            error={passwordError ?? undefined}
            placeholder="••••••"
          />

          {error && <Alert className="mb-4">{error}</Alert>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Aguarde..." : isLogin ? "Entrar" : "Cadastrar"}
          </Button>

          {/* alternar login/cadastro é ação primária: vira alvo de 44px em
              vez de um link de 16px no meio da frase */}
          <p className="mt-5 text-sm text-ink-muted text-center">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}
          </p>
          <Link
            to={isLogin ? "/registro" : "/login"}
            className="mt-1 flex items-center justify-center min-h-11 text-accent font-semibold underline underline-offset-4"
          >
            {isLogin ? "Cadastre-se" : "Entrar"}
          </Link>
        </form>
      </div>
    </div>
  );
}
