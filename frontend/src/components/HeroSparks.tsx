/**
 * Pontos luminosos espalhados atrás do hero. Puramente decorativo:
 * posições fixas (nada de aleatório, para não mudar a cada render) e fora
 * da árvore de acessibilidade.
 */
const SPARKS = [
  { top: "18%", left: "8%", delay: "0s" },
  { top: "34%", left: "4%", delay: "1.2s" },
  { top: "12%", left: "20%", delay: "2.4s" },
  { top: "58%", left: "13%", delay: "0.6s" },
  { top: "72%", left: "6%", delay: "1.8s" },
  { top: "16%", right: "9%", delay: "0.9s" },
  { top: "30%", right: "5%", delay: "2.1s" },
  { top: "48%", right: "14%", delay: "1.5s" },
  { top: "66%", right: "7%", delay: "0.3s" },
  { top: "80%", right: "18%", delay: "2.7s" },
];

export default function HeroSparks() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="spark"
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
