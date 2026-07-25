/**
 * Blobs âmbar animados do fundo. Puramente decorativo — fica fora da
 * árvore de acessibilidade e não intercepta ponteiro.
 * A animação é desligada por prefers-reduced-motion (ver index.css).
 */
export default function LavaBackground() {
  return (
    <div className="lava-bg" aria-hidden="true">
      <div className="lava-blob lava-1" />
      <div className="lava-blob lava-2" />
      <div className="lava-blob lava-3" />
      <div className="lava-blob lava-4" />
    </div>
  );
}
