import LavaBackground from "./LavaBackground";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useTheme } from "../lib/theme";

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
  const [theme] = useTheme();

  /*
    Um vídeo por tema, e não um só com filtro.

    O material escuro sob o tema claro escurecia o pergaminho e derrubava o
    âmbar para 4,44:1 — abaixo do mínimo. Compensar isso exigia véu de 0,94,
    que deixava passar 6% do vídeo: na prática, um fantasma.

    Trocar só o fundo do arquivo escuro não é possível: medido, as partes
    escuras dos objetos chegam a luminância 1 e o fundo fica em 6-7, então
    nenhum limiar separa os dois sem furar os livros.

    O arquivo claro já nasce na faixa do pergaminho (região do texto entre
    206 e 238), e por isso passa contraste até sem véu.
  */
  const src = theme === "light" ? "/fundo-hero-claro.mp4" : "/fundo-hero.mp4";

  return (
    <>
      {reduceMotion ? (
        <LavaBackground />
      ) : (
        <>
          <video
            className="hero-video"
            // key força o React a recriar o elemento ao trocar de tema; só
            // mudar o src deixaria o quadro anterior congelado até o novo
            // arquivo decodificar
            key={src}
            src={src}
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
