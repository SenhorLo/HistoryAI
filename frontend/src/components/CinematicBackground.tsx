import LavaBackground from "./LavaBackground";
import { useMediaQuery } from "../hooks/useMediaQuery";

/**
 * Fundo compartilhado pela landing e pela tela de auth: vídeo em tela cheia,
 * véu uniforme por cima e grão de papel.
 *
 * Vídeo que se move sozinho por mais de 5 segundos é o caso do WCAG 2.2.2.
 * Quem pede `prefers-reduced-motion` não recebe o vídeo — cai no fundo de
 * blobs, que o CSS já congela. Não basta `autoPlay={false}`: parado, o
 * <video> mostraria um retângulo preto até decodificar o primeiro quadro.
 *
 * O véu é uniforme e `fixed`, nunca um gradiente preso a uma seção: preso,
 * ele termina abrupto na borda do elemento e a emenda aparece como uma
 * faixa atravessando a página.
 */
export default function CinematicBackground() {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <>
      {reduceMotion ? (
        <LavaBackground />
      ) : (
        <>
          <video
            className="hero-video"
            src="/fundo-hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            // decorativo: nenhum conteúdo da página depende dele
            aria-hidden="true"
            tabIndex={-1}
          />
          <div className="video-scrim" aria-hidden="true" />
        </>
      )}
      <div className="paper-grain" aria-hidden="true" />
    </>
  );
}
