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

export type DocKind = "pdf" | "pptx";

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

const PDF_PROMPT = `Com base na conversa acima, gere o conteúdo de um DOCUMENTO PDF sobre o assunto que o usuário pediu.
Responda APENAS com JSON válido, sem cercas de código e sem texto fora do JSON, neste formato exato:
{"title": "título do documento", "subtitle": "subtítulo curto", "sections": [{"heading": "título da seção", "paragraphs": ["parágrafo 1", "parágrafo 2"], "bullets": ["item opcional"]}]}
Regras: 4 a 8 seções; parágrafos densos e informativos (3 a 6 frases cada); use "bullets" apenas quando fizer sentido; texto sem formatação Markdown (sem asteriscos ou #); em português do Brasil.`;

const PPTX_PROMPT = `Com base na conversa acima, gere o conteúdo de uma APRESENTAÇÃO DE SLIDES sobre o assunto que o usuário pediu.
Responda APENAS com JSON válido, sem cercas de código e sem texto fora do JSON, neste formato exato:
{"title": "título da apresentação", "subtitle": "subtítulo curto", "slides": [{"title": "título do slide", "bullets": ["ponto 1", "ponto 2"]}]}
Regras: 6 a 10 slides; 3 a 5 bullets por slide; bullets curtos e diretos (máximo ~15 palavras cada); texto sem formatação Markdown; em português do Brasil.`;

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

  const prompt = kind === "pdf" ? PDF_PROMPT : PPTX_PROMPT;
  const raw = await completeLLM(
    [...history, { role: "user", content: prompt }],
    { json: true },
  );
  const fileName = `${randomUUID()}.${kind}`;
  const filePath = path.join(FILES_DIR, fileName);

  let title: string;
  if (kind === "pdf") {
    const content = extractJson<PdfContent>(raw);
    await renderPdf(content, filePath);
    title = content.title;
  } else {
    const content = extractJson<PptxContent>(raw);
    await renderPptx(content, filePath);
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
