import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "./lib/auth";

/*
  Rotas carregadas sob demanda. O motivo é concreto: o GSAP só é usado na
  landing e somava ~40kB gzip ao bundle único — que todo mundo baixava,
  inclusive quem entra direto no chat e nunca vê uma animação de scroll.
*/
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));

function Protected({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}

/** Espera entre chunks — só o fundo, para não piscar conteúdo falso. */
function RouteFallback() {
  return (
    <div
      className="min-h-dvh bg-surface"
      role="status"
      aria-label="Carregando"
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/registro" element={<AuthPage mode="register" />} />
          <Route
            path="/chat"
            element={
              <Protected>
                <ChatPage />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
