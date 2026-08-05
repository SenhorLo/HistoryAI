import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import CinematicBackground from "../components/CinematicBackground";
import Logo from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Alert } from "../components/ui/Alert";
import PasswordChecklist from "../components/ui/PasswordChecklist";
import { login, register } from "../lib/api";
import { saveSession } from "../lib/auth";
import { emailFailure, isPasswordValid } from "../lib/validation";

interface Props {
  mode: "login" | "register";
}

export default function AuthPage({ mode }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    /*
      Validação só no cadastro. No login as regras não se aplicam: quem criou
      a conta antes delas tem senha (e possivelmente domínio) fora do padrão
      e precisa continuar entrando — o backend segue a mesma lógica.
    */
    if (!isLogin) {
      const emailIssue = emailFailure(email);
      if (emailIssue) {
        setEmailError(emailIssue);
        return;
      }
      if (!isPasswordValid(password)) {
        setPasswordError("A senha ainda não atende aos requisitos abaixo.");
        return;
      }
    }

    setLoading(true);
    try {
      const result = isLogin
        ? await login(email, password)
        : await register(email, password);
      saveSession(result.token, result.email, result.displayName ?? null);
      navigate("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <CinematicBackground />
      <ThemeToggle className="absolute top-4 right-4 z-20" />

      {/*
        Conteúdo à esquerda, na mesma gutter da landing (px-6 / md:px-12),
        para as duas telas lerem como o mesmo produto. No mobile o max-w-md
        já ocupa a largura toda, então o alinhamento à esquerda não cria
        desequilíbrio.
      */}
      <div className="relative z-10 min-h-dvh flex items-center px-6 md:px-12 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Logo size="lg" className="mb-3" />
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
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            error={emailError ?? undefined}
            placeholder="voce@gmail.com"
          />

          <Field
            label="Senha"
            type="password"
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            error={passwordError ?? undefined}
            placeholder="••••••••"
          />

          {/* requisitos só no cadastro: no login eles seriam ruído, e ainda
              exporiam a política de senha para quem está tentando adivinhar */}
          {!isLogin && <PasswordChecklist value={password} />}

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

          {/* saída sem beco: quem caiu aqui sem querer criar conta consegue voltar */}
          <Link
            to="/"
            className="mt-4 flex items-center justify-center gap-1.5 min-h-11 text-sm text-ink-muted hover:text-ink transition-colors duration-200"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
