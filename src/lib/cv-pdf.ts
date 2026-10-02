/**
 * Small, dependency-free PDF writer for selectable, single-column CV text.
 * Courier uses WinAnsi encoding (English and Western European scripts).
 * Unsupported characters fail explicitly, rather than silently corrupting a CV.
 */
const extraCharacters: Record<string, number> = {
  "€": 128, "‚": 130, "ƒ": 131, "„": 132, "…": 133, "†": 134, "‡": 135,
  "ˆ": 136, "‰": 137, "Š": 138, "‹": 139, "Œ": 140, "Ž": 142,
  "‘": 145, "’": 146, "“": 147, "”": 148, "•": 149, "–": 150, "—": 151,
  "˜": 152, "™": 153, "š": 154, "›": 155, "œ": 156, "ž": 158, "Ÿ": 159
};
function encodeText(value: string) {
  return Array.from(value).map((character) => {
    const code = character.codePointAt(0)!;
    const byte = extraCharacters[character] ?? code;
    if (!(byte >= 32 && byte <= 126 || byte >= 160 && byte <= 255 || extraCharacters[character])) {
      throw new Error("PDF download supports English and Western European text. Use Print / Save as PDF for other scripts.");
    }
    return byte >= 127 ? `\\${byte.toString(8).padStart(3, "0")}` : character.replace(/[\\()]/g, "\\$&");
  }).join("");
}
export function wrapCvText(text: string, width = 79): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n")) {
    let remaining = paragraph;
    while (remaining.length > width) {
      const lastSpace = remaining.lastIndexOf(" ", width);
      const split = lastSpace > 0 ? lastSpace : width;
      lines.push(remaining.slice(0, split));
      remaining = remaining.slice(split).replace(/^ +/, "");
    }
    lines.push(remaining);
  }
  return lines;
}
export function buildCvPdf(text: string): Uint8Array {
  const lines = wrapCvText(text).map(encodeText);
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += 51) pages.push(lines.slice(i, i + 51));
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 4 + index * 2);
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");
  pages.forEach((page, index) => {
    const pageId = pageIds[index];
    const stream = `BT\n/F1 10.5 Tf\n14 TL\n48 790 Td\n${page.map((line) => `(${line}) Tj\nT*`).join("\n")}\nET\n`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageId + 1} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  });
  let output = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(output.length);
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(output);
}
