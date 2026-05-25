import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { format } from "date-fns";
import { formatMoneyPdf, pdfSafeText } from "@/lib/format";
import {
  formatSenderPhone,
  quotationBranding,
} from "@/lib/quotation-branding";
import type { QuotationDocument } from "@/lib/quotation-document";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const BOTTOM = 70;

const gray = rgb(0.39, 0.45, 0.55);
const dark = rgb(0.06, 0.09, 0.15);
const body = rgb(0.2, 0.25, 0.33);
const lineColor = rgb(0.89, 0.91, 0.94);
const accent = rgb(0.39, 0.4, 0.95);
const logoBg = rgb(0.12, 0.16, 0.23);
const logoInner = rgb(0.2, 0.25, 0.33);

function wrapLines(
  value: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  for (const paragraph of value.split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(pdfSafeText(test), size) <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export async function buildQuotationPdfBuffer(
  doc: QuotationDocument
): Promise<Buffer> {
  const { customer, lines, subtotal, discountApplied, total, requirementsSections, quotedAt } =
    doc;

  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  let y = PAGE_HEIGHT - MARGIN;

  const text = (value: string) => pdfSafeText(value);

  const ensureSpace = (needed: number) => {
    if (y - needed >= BOTTOM) return;
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const step = (amount: number) => {
    y -= amount;
  };

  const drawWrapped = (
    value: string,
    size: number,
    font: PDFFont,
    color: ReturnType<typeof rgb>,
    lineGap = 14
  ) => {
    for (const line of wrapLines(value, font, size, contentWidth)) {
      ensureSpace(lineGap + 4);
      if (line) {
        page.drawText(text(line), {
          x: MARGIN,
          y: y - size,
          size,
          font,
          color,
        });
      }
      step(lineGap);
    }
  };

  const drawLine = () => {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + contentWidth, y },
      thickness: 1,
      color: lineColor,
    });
    step(10);
  };

  // Logo mark (drawn)
  page.drawRectangle({
    x: MARGIN,
    y: y - 48,
    width: 48,
    height: 48,
    color: logoBg,
    borderColor: accent,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: MARGIN + 4,
    y: y - 44,
    width: 40,
    height: 40,
    color: logoInner,
  });
  page.drawText("EZ", {
    x: MARGIN + 13,
    y: y - 28,
    size: 14,
    font: bold,
    color: rgb(0.97, 0.98, 0.99),
  });
  page.drawText("WEB", {
    x: MARGIN + 11,
    y: y - 40,
    size: 8,
    font: bold,
    color: accent,
  });

  page.drawText(text(quotationBranding.companyName), {
    x: MARGIN + 58,
    y: y - 18,
    size: 14,
    font: bold,
    color: dark,
  });
  page.drawText(text(quotationBranding.companyTagline), {
    x: MARGIN + 58,
    y: y - 32,
    size: 9,
    font: regular,
    color: gray,
  });

  const quoteLabel = "QUOTATION";
  page.drawText(quoteLabel, {
    x: MARGIN + contentWidth - bold.widthOfTextAtSize(quoteLabel, 10),
    y: y - 16,
    size: 10,
    font: bold,
    color: accent,
  });
  const dateStr = format(quotedAt, "MMM d, yyyy");
  page.drawText(text(dateStr), {
    x: MARGIN + contentWidth - regular.widthOfTextAtSize(text(dateStr), 9),
    y: y - 30,
    size: 9,
    font: regular,
    color: gray,
  });

  step(58);
  drawLine();

  page.drawText("PREPARED FOR", {
    x: MARGIN,
    y: y - 8,
    size: 8,
    font: bold,
    color: gray,
  });
  step(14);
  page.drawText(text(customer.name), {
    x: MARGIN,
    y: y - 13,
    size: 13,
    font: bold,
    color: dark,
  });
  step(18);
  page.drawText(text(customer.companyName), {
    x: MARGIN,
    y: y - 11,
    size: 11,
    font: regular,
    color: body,
  });
  step(16);
  if (customer.phone?.trim()) {
    const phoneLine = `Phone: ${customer.phone.trim()}`;
    page.drawText(text(phoneLine), {
      x: MARGIN,
      y: y - 10,
      size: 10,
      font: regular,
      color: body,
    });
    step(14);
  }
  if (customer.email?.trim()) {
    const emailLine = `Email: ${customer.email.trim()}`;
    page.drawText(text(emailLine), {
      x: MARGIN,
      y: y - 10,
      size: 10,
      font: regular,
      color: body,
    });
    step(14);
  }

  step(8);

  if (requirementsSections.length > 0) {
    page.drawText("REQUIREMENTS", {
      x: MARGIN,
      y: y - 8,
      size: 8,
      font: bold,
      color: gray,
    });
    step(16);

    for (const section of requirementsSections) {
      ensureSpace(40);
      page.drawText(text(section.title), {
        x: MARGIN,
        y: y - 10,
        size: 10,
        font: bold,
        color: dark,
      });
      step(14);
      drawWrapped(section.body, 9, regular, body, 12);
      step(6);
    }
  }

  step(4);
  ensureSpace(80);
  page.drawText("INVESTMENT", {
    x: MARGIN,
    y: y - 8,
    size: 8,
    font: bold,
    color: gray,
  });
  step(14);

  const amountColRight = MARGIN + contentWidth;
  page.drawText("ITEM", {
    x: MARGIN,
    y: y - 9,
    size: 9,
    font: bold,
    color: gray,
  });
  page.drawText("AMOUNT", {
    x: amountColRight - bold.widthOfTextAtSize("AMOUNT", 9),
    y: y - 9,
    size: 9,
    font: bold,
    color: gray,
  });
  step(12);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + contentWidth, y },
    thickness: 1,
    color: lineColor,
  });
  step(10);

  const rowSize = 10;
  const rowGap = 20;

  if (lines.length === 0) {
    drawWrapped("No priced line items in scope.", rowSize, regular, gray, rowGap);
  } else {
    for (const line of lines) {
      ensureSpace(rowGap + 8);
      const labelLines = wrapLines(line.label, regular, rowSize, contentWidth - 110);
      const amountStr = formatMoneyPdf(line.amount);
      page.drawText(text(labelLines[0] ?? ""), {
        x: MARGIN,
        y: y - rowSize,
        size: rowSize,
        font: regular,
        color: dark,
      });
      page.drawText(amountStr, {
        x: amountColRight - regular.widthOfTextAtSize(amountStr, rowSize),
        y: y - rowSize,
        size: rowSize,
        font: regular,
        color: dark,
      });
      step(rowGap);
      for (let i = 1; i < labelLines.length; i++) {
        ensureSpace(rowGap);
        page.drawText(text(labelLines[i]!), {
          x: MARGIN,
          y: y - rowSize,
          size: rowSize,
          font: regular,
          color: dark,
        });
        step(rowGap - 4);
      }
    }
  }

  if (lines.length > 0 && discountApplied > 0) {
    ensureSpace(rowGap);
    page.drawText("Subtotal", { x: MARGIN, y: y - rowSize, size: rowSize, font: regular, color: body });
    const subtotalStr = formatMoneyPdf(subtotal);
    page.drawText(subtotalStr, {
      x: amountColRight - regular.widthOfTextAtSize(subtotalStr, rowSize),
      y: y - rowSize,
      size: rowSize,
      font: regular,
      color: body,
    });
    step(rowGap);
    page.drawText("Discount", { x: MARGIN, y: y - rowSize, size: rowSize, font: regular, color: body });
    const discountStr = `-${formatMoneyPdf(discountApplied)}`;
    page.drawText(discountStr, {
      x: amountColRight - regular.widthOfTextAtSize(discountStr, rowSize),
      y: y - rowSize,
      size: rowSize,
      font: regular,
      color: body,
    });
    step(rowGap);
  }

  ensureSpace(24);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + contentWidth, y },
    thickness: 1,
    color: lineColor,
  });
  step(14);

  const totalSize = 12;
  page.drawText("Total", {
    x: MARGIN,
    y: y - totalSize,
    size: totalSize,
    font: bold,
    color: dark,
  });
  const totalStr = formatMoneyPdf(total);
  page.drawText(totalStr, {
    x: amountColRight - bold.widthOfTextAtSize(totalStr, totalSize),
    y: y - totalSize,
    size: totalSize,
    font: bold,
    color: dark,
  });
  step(36);

  ensureSpace(60);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + contentWidth, y },
    thickness: 1,
    color: lineColor,
  });
  step(14);

  page.drawText(text(quotationBranding.senderName), {
    x: MARGIN,
    y: y - 11,
    size: 11,
    font: bold,
    color: dark,
  });
  step(15);
  page.drawText(text(quotationBranding.companyName), {
    x: MARGIN,
    y: y - 10,
    size: 10,
    font: regular,
    color: body,
  });
  step(14);
  const senderPhone = `Phone: ${formatSenderPhone(quotationBranding.senderPhone)}`;
  page.drawText(text(senderPhone), {
    x: MARGIN,
    y: y - 10,
    size: 10,
    font: regular,
    color: body,
  });
  step(14);
  if (quotationBranding.senderEmail) {
    const senderEmail = `Email: ${quotationBranding.senderEmail}`;
    page.drawText(text(senderEmail), {
      x: MARGIN,
      y: y - 10,
      size: 10,
      font: regular,
      color: body,
    });
    step(14);
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
