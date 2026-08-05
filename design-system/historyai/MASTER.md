# HistoryAI — Design System (Master)

Fonte da verdade do frontend. Gerado a partir da skill `ui-ux-pro-max`
(consulta em `--design-system` + domínios `color`, `typography`, `ux`,
`--stack react`) e ajustado à identidade já existente do produto.

**Implementação:** `frontend/src/index.css` (bloco de tokens).
Componentes **nunca** usam hex cru nem escalas do Tailwind (`stone-400`,
`amber-700`). Só tokens semânticos.

---

## Produto

| | |
|---|---|
| Tipo | Ferramenta de IA conversacional, nicho educacional |
| Domínio | História contrafactual, filosofia, sociologia, teologia |
| Padrão | Content-first / leitura longa |
| Modo primário | Escuro (claro totalmente suportado) |
| Stack | React 19 · Vite 8 · Tailwind v4 · react-router 7 · lucide-react |

## Estilo

**Modern Dark + pergaminho acadêmico.** Fundo âmbar animado (lava lamp),
superfícies translúcidas, zero sombra pesada. Ícones sempre SVG (lucide) —
nunca emoji.

A base recomendou a paleta "Academic Journal" (navy `#1E3A5F` + dourado).
Descartada: a identidade âmbar/pergaminho já existente é mais distintiva e
foi validada pelo segundo resultado da base (`#D97706` sobre `#FFFBEB`).
O que se aproveitou da recomendação foi a **tipografia**.

## Tipografia

Duas famílias com **papéis semânticos distintos** — a diferença de desenho é
o que separa, de relance, o que o usuário lê do que o sistema diz.

| Papel | Fonte | Uso |
|---|---|---|
| `font-body` / `font-heading` | **Nunito** | Conteúdo: mensagens da IA, títulos de conversa, headings. Terminais arredondados |
| `font-system` | **Rubik** | Chrome: rótulos de grupo, botões, dicas, rodapé, meta |

Aplicação do chrome pela classe `.ui-text`; rótulos de seção pela
`.section-label` (Rubik + caixa-alta + entreletra 0.14em).

**Por que duas famílias:** numa barra lateral, "ÚLTIMOS 7 DIAS" e um título de
conversa competiam visualmente quando compartilhavam a mesma fonte. Separar
por família resolve sem depender só de cor ou tamanho.

> Houve uma passagem por **JetBrains Mono** em toda a interface. Foi
> revertida: o ganho estético não compensou perder essa separação de papéis.
> Registro útil da época — medido, a mono era ~9% mais **estreita** que a
> Nunito no mesmo corpo, ao contrário do que se supõe.

Base de corpo: **16px**. Nunito tem altura-x generosa e não precisa do
acréscimo que a serif anterior exigia.

Medida de leitura das respostas: `max-width: 70ch`.

## Cores (tokens semânticos)

Contrastes medidos contra o fundo **mais escuro** de cada tema (pior caso —
as superfícies translúcidas só clareiam).

| Token | Claro | Escuro | Contraste |
|---|---|---|---|
| `surface` | `#efe8da` | `#0c0a09` | — |
| `ink` | `#292524` | `#f5f5f4` | 12.4:1 / 18.1:1 |
| `ink-muted` | `#57534e` | `#a8a29e` | 6.3:1 / 7.8:1 |
| `ink-subtle` | `#6b645d` | `#8a837d` | 4.7:1 / 5.2:1 |
| `accent` (texto) | `#92400e` | `#fbbf24` | 5.8:1 / 11.8:1 |
| `accent-solid` (fundo de botão) | `#b45309` | `#b45309` | branco por cima = 5.0:1 |
| `danger` | `#b91c1c` | `#f87171` | 5.3:1 / 7.1:1 |

Mais: `surface-raised`, `surface-sunken`, `surface-hover`, `surface-active`,
`accent-wash`, `accent-line`, `subtle`/`strong` (bordas), `focus`.

**Hover do botão primário escurece** (`accent-solid-hover`). Clarear para
`amber-600` derrubaria o branco por cima para 3.2:1.

### Cores que NÃO podem voltar

Reprovadas sobre o pergaminho `#efe8da`:

| | Contraste | Onde estava |
|---|---|---|
| `stone-400` `#a8a29e` | **2.07:1** | e-mail na sidebar, rodapé, lista vazia |
| `amber-600` `#d97706` | **2.61:1** | label "Escrevendo...", ícones |
| `stone-500` `#78716c` | 3.94:1 | textos secundários |
| `amber-700` `#b45309` | 4.12:1 | links, logo |

## Movimento

Dial 3/10 — sutil. Transições de 200ms (faixa 150–300ms). Só `color`,
`background-color`, `opacity` e `transform` — nunca `width`/`height`.
`prefers-reduced-motion` desliga blobs e zera todas as durações.

## Regras não-negociáveis

1. **Foco visível** — `:focus-visible` global em `index.css`. Nunca remover.
2. **Alvo de toque ≥ 44×44px** — `min-h-11 min-w-11`. Vale inclusive para
   links que são ação primária.
3. **Botão só de ícone exige nome** — use `<IconButton label="...">`, que
   torna `label` obrigatório em tipo.
4. **Nada dependente só de hover** — revelar no hover só a partir de `md`,
   sempre com `group-focus-within` junto.
5. **Label visível e associado** — `<Field>` cuida de `htmlFor`/`id`/
   `aria-describedby`/`aria-invalid`. Placeholder nunca é label.
6. **Erro perto do campo** — erro de validação vai no `<Field error>`;
   `<Alert role="alert">` só para falha global do formulário.
7. **Streaming não vai em `aria-live`** — texto caractere a caractere vira
   spam. Só o *estado* é anunciado, por um `role="status"` sr-only.
8. **`h-dvh`, nunca `h-screen`** — barra dinâmica do navegador mobile.
9. **Gaveta fechada é `inert`** — senão o Tab caminha por links fora da tela.
   Escape fecha e o foco volta para quem abriu.

## Componentes

```
components/
  ui/Button.tsx      Button · ButtonLink · IconButton (label obrigatório)
  ui/Field.tsx       input com label, hint, erro e ligações ARIA
  ui/Alert.tsx       erro global com role="alert"
  LavaBackground     fundo decorativo, aria-hidden
  Sidebar            gaveta com inert/Escape/restauro de foco
  ConversationItem   item + confirmação de exclusão inline
  MessageBubble      memo — evita re-parsear Markdown a cada chunk
  chat/MessageList   log + região de status
  chat/ChatComposer  textarea auto-ajustável
  chat/EmptyState    sugestões clicáveis
hooks/
  useChat            conversas, cache, streaming SSE, abort
  useMediaQuery      useIsDesktop (breakpoint md)
```

## Como verificar

Auditoria de contraste e de alvos de toque roda no DOM renderizado, com
composição de fundos translúcidos — ver o histórico da refatoração. Rodar
nos **dois temas** e em 375 / 768 / 1280px.
