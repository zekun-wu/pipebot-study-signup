import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CONSENT_TITLE, CONSENT_SECTIONS } from "./consent";

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 56;
const BODY_SIZE = 10.5;
const HEAD_SIZE = 13;
const TITLE_SIZE = 16;
const LINE_GAP = 4;

// Replace characters that Helvetica (WinAnsi) cannot encode.
function sanitize(text) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF—€]/g, "?");
}

function wrap(text, font, size, maxWidth) {
  const words = sanitize(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildSignedConsentPdf({
  name,
  email,
  mode,
  sessionText,
  signaturePngDataUrl,
  signedAtText,
}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const maxW = PAGE_W - MARGIN * 2;

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensureSpace = (needed) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const drawLines = (lines, usedFont, size, indent = 0) => {
    for (const line of lines) {
      ensureSpace(size + LINE_GAP);
      page.drawText(line, {
        x: MARGIN + indent,
        y: y - size,
        size,
        font: usedFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= size + LINE_GAP;
    }
  };

  const drawParagraph = (text, size = BODY_SIZE, usedFont = font, indent = 0) => {
    drawLines(wrap(text, usedFont, size, maxW - indent), usedFont, size, indent);
    y -= 4;
  };

  const drawBullets = (items) => {
    for (const item of items) {
      const lines = wrap(item, font, BODY_SIZE, maxW - 18);
      ensureSpace(BODY_SIZE + LINE_GAP);
      page.drawText("•", {
        x: MARGIN + 4,
        y: y - BODY_SIZE,
        size: BODY_SIZE,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      drawLines(lines, font, BODY_SIZE, 18);
      y -= 1;
    }
    y -= 4;
  };

  // Title
  drawLines(wrap(CONSENT_TITLE, bold, TITLE_SIZE, maxW), bold, TITLE_SIZE);
  y -= 10;

  for (const section of CONSENT_SECTIONS) {
    ensureSpace(HEAD_SIZE + 30);
    y -= 6;
    drawParagraph(section.heading, HEAD_SIZE, bold);
    for (const p of section.paragraphs || []) drawParagraph(p);
    if (section.bullets) drawBullets(section.bullets);
    for (const p of section.paragraphsAfter || []) drawParagraph(p);
    if (section.bulletsAfter) drawBullets(section.bulletsAfter);
  }

  // Signature block
  ensureSpace(220);
  y -= 10;
  drawParagraph("Participant", HEAD_SIZE, bold);
  drawParagraph(`Name: ${name}`);
  drawParagraph(`Email: ${email}`);
  drawParagraph(`Participation mode: ${mode === "in_person" ? "In person" : "Remote (Microsoft Teams)"}`);
  if (sessionText) drawParagraph(`Booked session: ${sessionText}`);
  drawParagraph(`Date signed: ${signedAtText}`);

  drawParagraph("Signature:");
  try {
    const base64 = String(signaturePngDataUrl).split(",")[1];
    const png = await doc.embedPng(Buffer.from(base64, "base64"));
    const sigW = 220;
    const sigH = (png.height / png.width) * sigW;
    ensureSpace(sigH + 16);
    page.drawImage(png, { x: MARGIN, y: y - sigH, width: sigW, height: sigH });
    page.drawLine({
      start: { x: MARGIN, y: y - sigH - 4 },
      end: { x: MARGIN + sigW, y: y - sigH - 4 },
      thickness: 0.8,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= sigH + 20;
  } catch (err) {
    drawParagraph("[signature image could not be embedded]");
  }

  y -= 14;
  drawParagraph("Researcher", HEAD_SIZE, bold);
  drawParagraph("Name: _______________________________");
  drawParagraph("Signature: ___________________________");
  drawParagraph("Date: _______________________________");

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
