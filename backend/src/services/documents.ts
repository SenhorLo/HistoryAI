import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import PDFDocument from "pdfkit";
import pptxgenjs from "pptxgenjs";

// Interop CJS/ESM: dependendo do carregador, a classe vem em .default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Pptxgen: any = (pptxgenjs as any).default ?? pptxgenjs;
import { jsonrepair } from "jsonrepair";
import { completeLLM, type LLMMessage } from "./llm.js";

// Arquivos gerados ficam em backend/files/ com nomes aleatórios (não adivinháveis)
export const FILES_DIR = path.resolve(process.cwd(), "files");

export type DocKind = "pdf" | "pptx" | "mindmap";

/** Extensão do arquivo entregue para cada tipo de documento. */
const FILE_EXTENSION: Record<DocKind, string> = {
  pdf: "pdf",
  pptx: "pptx",
  // o mapa mental também sai em PDF: é o formato que todo mundo abre e imprime
  mindmap: "pdf",
};

interface PdfContent {
  title: string;
  subtitle?: string;
  sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
}

interface PptxContent {
  title: string;
  subtitle?: string;
  slides: { title: string; bullets: string[] }[];
}

interface MindmapBranch {
  label: string;
  children?: { label: string }[];
}

interface MindmapContent {
  title: string;
  center: string;
  branches: MindmapBranch[];
}

const PDF_PROMPT = `Com base na conversa acima, gere o conteúdo de um DOCUMENTO PDF sobre o assunto que o usuário pediu.
Responda APENAS com JSON válido, sem cercas de código e sem texto fora do JSON, neste formato exato:
{"title": "título do documento", "subtitle": "subtítulo curto", "sections": [{"heading": "título da seção", "paragraphs": ["parágrafo 1", "parágrafo 2"], "bullets": ["item opcional"]}]}
Regras: 4 a 8 seções; parágrafos densos e informativos (3 a 6 frases cada); use "bullets" apenas quando fizer sentido; texto sem formatação Markdown (sem asteriscos ou #); em português do Brasil.`;

const PPTX_PROMPT = `Com base na conversa acima, gere o conteúdo de uma APRESENTAÇÃO DE SLIDES sobre o assunto que o usuário pediu.
Responda APENAS com JSON válido, sem cercas de código e sem texto fora do JSON, neste formato exato:
{"title": "título da apresentação", "subtitle": "subtítulo curto", "slides": [{"title": "título do slide", "bullets": ["ponto 1", "ponto 2"]}]}
Regras: 6 a 10 slides; 3 a 5 bullets por slide; bullets curtos e diretos (máximo ~15 palavras cada); texto sem formatação Markdown; em português do Brasil.`;

const MINDMAP_PROMPT = `Com base na conversa acima, gere o conteúdo de um MAPA MENTAL sobre o assunto que o usuário pediu.
Responda APENAS com JSON válido, sem cercas de código e sem texto fora do JSON, neste formato exato:
{"title": "título do mapa", "center": "conceito central em 1 a 3 palavras", "branches": [{"label": "ramo principal", "children": [{"label": "subtópico"}]}]}
Regras: 4 a 6 ramos principais; 2 a 4 subtópicos por ramo; rótulos MUITO curtos (máximo 5 palavras no ramo, 7 no subtópico) porque vão dentro de caixas pequenas; sem formatação Markdown; sem numeração; em português do Brasil.`;

function extractJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("A IA não retornou um JSON válido para o documento.");
  }
  const raw = text.slice(start, end + 1);
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Rede de segurança: conserta aspas não escapadas, vírgulas sobrando etc.
    return JSON.parse(jsonrepair(raw)) as T;
  }
}

export async function generateDocument(
  kind: DocKind,
  history: LLMMessage[],
): Promise<{ url: string; title: string }> {
  fs.mkdirSync(FILES_DIR, { recursive: true });

  const prompt =
    kind === "pdf"
      ? PDF_PROMPT
      : kind === "pptx"
        ? PPTX_PROMPT
        : MINDMAP_PROMPT;

  const raw = await completeLLM(
    [...history, { role: "user", content: prompt }],
    { json: true },
  );
  const fileName = `${randomUUID()}.${FILE_EXTENSION[kind]}`;
  const filePath = path.join(FILES_DIR, fileName);

  let title: string;
  if (kind === "pdf") {
    const content = extractJson<PdfContent>(raw);
    await renderPdf(content, filePath);
    title = content.title;
  } else if (kind === "pptx") {
    const content = extractJson<PptxContent>(raw);
    await renderPptx(content, filePath);
    title = content.title;
  } else {
    const content = extractJson<MindmapContent>(raw);
    await renderMindmap(content, filePath);
    title = content.title;
  }

  return { url: `/api/files/${fileName}`, title };
}

function renderPdf(c: PdfContent, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: "A4" });
    const out = fs.createWriteStream(filePath);
    out.on("finish", () => resolve());
    out.on("error", reject);
    doc.pipe(out);

    // Capa/cabeçalho
    doc.font("Helvetica-Bold").fontSize(26).fillColor("#92400e").text(c.title);
    if (c.subtitle) {
      doc.moveDown(0.3).font("Helvetica").fontSize(13).fillColor("#57534e").text(c.subtitle);
    }
    doc.moveDown(0.4).font("Helvetica-Oblique").fontSize(9).fillColor("#a8a29e")
      .text("Gerado por HistoryAI");
    doc.moveDown(0.6)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#d6d3d1")
      .stroke();

    for (const s of c.sections ?? []) {
      doc.moveDown(1.1).font("Helvetica-Bold").fontSize(15).fillColor("#1c1917").text(s.heading);
      doc.moveDown(0.35);
      for (const p of s.paragraphs ?? []) {
        doc.font("Helvetica").fontSize(11).fillColor("#292524")
          .text(p, { align: "justify", lineGap: 3 });
        doc.moveDown(0.45);
      }
      if (s.bullets?.length) {
        doc.font("Helvetica").fontSize(11).fillColor("#292524")
          .list(s.bullets, { bulletRadius: 2, lineGap: 3 });
      }
    }

    doc.end();
  });
}

/*
  Mapa mental em PDF paisagem: conceito central no meio, ramos distribuídos
  à esquerda e à direita, subtópicos na borda externa de cada ramo.

  O layout é calculado, não fixo: a altura útil é dividida pelo número de
  ramos de cada lado, e as caixas são medidas pelo texto real. Com rótulo
  longo o desenho degrada (a caixa cresce), então há corte defensivo — o
  prompt pede rótulos curtos, mas não dá para confiar só nisso.
*/
const BRANCH_COLORS = [
  "#b45309",
  "#92400e",
  "#a16207",
  "#c2410c",
  "#854d0e",
  "#9a3412",
];

const MAX_BRANCHES = 6;
const MAX_CHILDREN = 4;

/** Corta rótulo que estouraria a caixa, preservando palavra inteira. */
function clampLabel(text: string, max: number): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

// exportado para permitir renderizar sem passar pela IA (teste do layout)
export function renderMindmap(
  c: MindmapContent,
  filePath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
    const out = fs.createWriteStream(filePath);
    out.on("finish", () => resolve());
    out.on("error", reject);
    doc.pipe(out);

    const W = doc.page.width;
    const H = doc.page.height;

    doc.rect(0, 0, W, H).fill("#fffbf2");

    // Cabeçalho
    doc
      .font("Helvetica-Bold")
      .fontSize(17)
      .fillColor("#7c2d12")
      .text(clampLabel(c.title ?? "Mapa mental", 90), 40, 34, {
        width: W - 80,
        align: "center",
      });
    doc
      .font("Helvetica-Oblique")
      .fontSize(8.5)
      .fillColor("#a8a29e")
      .text("Gerado por HistoryAI", 40, 56, { width: W - 80, align: "center" });

    const branches = (c.branches ?? []).slice(0, MAX_BRANCHES);
    const cx = W / 2;
    const cy = H / 2 + 14;

    // ---- caixa central ----
    const centerLabel = clampLabel(c.center ?? c.title ?? "Tema", 34);
    doc.font("Helvetica-Bold").fontSize(15);
    const cw = Math.min(doc.widthOfString(centerLabel) + 34, 230);
    const ch = 46;
    doc
      .roundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 12)
      .fill("#7c2d12");
    doc
      .fillColor("#fffbf2")
      .text(centerLabel, cx - cw / 2 + 10, cy - 8, {
        width: cw - 20,
        align: "center",
      });

    // ---- ramos, alternando lados ----
    const right = branches.filter((_, i) => i % 2 === 0);
    const left = branches.filter((_, i) => i % 2 === 1);

    const drawSide = (list: MindmapBranch[], dir: 1 | -1) => {
      if (list.length === 0) return;
      const top = 96;
      const bottom = H - 46;
      const slot = (bottom - top) / list.length;

      list.forEach((branch, i) => {
        const color =
          BRANCH_COLORS[
            (branches.indexOf(branch) + BRANCH_COLORS.length) %
              BRANCH_COLORS.length
          ];
        const by = top + slot * (i + 0.5);
        const label = clampLabel(branch.label ?? "", 30);

        doc.font("Helvetica-Bold").fontSize(10.5);
        const bw = Math.min(doc.widthOfString(label) + 24, 150);
        const bh = 30;
        const bx = cx + dir * (cw / 2 + 62) - (dir === 1 ? 0 : bw);

        // conector central → ramo
        const startX = cx + dir * (cw / 2);
        const endX = dir === 1 ? bx : bx + bw;
        doc
          .moveTo(startX, cy)
          .bezierCurveTo(
            startX + dir * 34,
            cy,
            endX - dir * 34,
            by,
            endX,
            by,
          )
          .lineWidth(2)
          .strokeColor(color)
          .stroke();

        doc.roundedRect(bx, by - bh / 2, bw, bh, 9).fill(color);
        doc
          .fillColor("#fffbf2")
          .text(label, bx + 8, by - 6, { width: bw - 16, align: "center" });

        // ---- subtópicos ----
        const kids = (branch.children ?? []).slice(0, MAX_CHILDREN);
        if (kids.length === 0) return;
        const kidGap = Math.min(30, (slot - 12) / kids.length);
        const kidTop = by - ((kids.length - 1) * kidGap) / 2;

        kids.forEach((kid, k) => {
          const ky = kidTop + k * kidGap;
          const kLabel = clampLabel(kid.label ?? "", 34);
          doc.font("Helvetica").fontSize(8.5);
          const kw = Math.min(doc.widthOfString(kLabel) + 20, 155);
          const kh = 22;
          const kx = dir === 1 ? bx + bw + 40 : bx - 40 - kw;

          const from = dir === 1 ? bx + bw : bx;
          const to = dir === 1 ? kx : kx + kw;
          doc
            .moveTo(from, by)
            .bezierCurveTo(from + dir * 20, by, to - dir * 20, ky, to, ky)
            .lineWidth(1)
            .strokeColor(color)
            .stroke();

          doc.roundedRect(kx, ky - kh / 2, kw, kh, 7).fillAndStroke(
            "#ffffff",
            color,
          );
          doc
            .fillColor("#292524")
            .text(kLabel, kx + 7, ky - 4.5, {
              width: kw - 14,
              align: "center",
            });
        });
      });
    };

    drawSide(right, 1);
    drawSide(left, -1);

    doc.end();
  });
}

async function renderPptx(c: PptxContent, filePath: string): Promise<void> {
  const pres = new Pptxgen();
  pres.layout = "LAYOUT_16x9";

  // Slide de capa
  const cover = pres.addSlide();
  cover.background = { color: "1C1917" };
  cover.addText(c.title, {
    x: 0.5, y: 1.5, w: 9, h: 1.6,
    fontSize: 34, bold: true, color: "FDE68A", align: "left",
  });
  if (c.subtitle) {
    cover.addText(c.subtitle, {
      x: 0.5, y: 3.1, w: 9, h: 0.8, fontSize: 18, color: "D6D3D1",
    });
  }
  cover.addText("Gerado por HistoryAI", {
    x: 0.5, y: 4.9, w: 9, h: 0.4, fontSize: 11, color: "78716C",
  });

  for (const s of c.slides ?? []) {
    const slide = pres.addSlide();
    slide.background = { color: "1C1917" };
    slide.addText(s.title, {
      x: 0.5, y: 0.35, w: 9, h: 0.8, fontSize: 25, bold: true, color: "FDE68A",
    });
    slide.addText(
      (s.bullets ?? []).map((b) => ({
        text: b,
        options: { bullet: { code: "2022" }, breakLine: true },
      })),
      {
        x: 0.7, y: 1.35, w: 8.6, h: 3.9,
        fontSize: 15, color: "E7E5E4", valign: "top",
        lineSpacingMultiple: 1.35,
      },
    );
  }

  await pres.writeFile({ fileName: filePath });
}
