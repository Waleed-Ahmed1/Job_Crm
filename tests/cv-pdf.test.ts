import { describe, expect, it } from "vitest";
import { buildCvPdf, wrapCvText } from "@/lib/cv-pdf";
import { cvSchema } from "@/lib/cv";
describe("CV PDF export", () => {
  it("writes selectable text and valid object offsets, escaping PDF syntax", () => {
    const pdf = new TextDecoder().decode(buildCvPdf("Jane (Designer) \\ Portfolio\nEXPERIENCE\nBuilt products."));
    expect(pdf).toContain("%PDF-1.4");
    expect(pdf).toContain("Jane \\(Designer\\) \\\\ Portfolio");
    const start = Number(pdf.match(/startxref\n(\d+)/)?.[1]);
    expect(pdf.slice(start, start + 4)).toBe("xref");
    const offsets = [...pdf.matchAll(/(\d{10}) 00000 n/g)].map((match) => Number(match[1]));
    offsets.forEach((offset, index) => expect(pdf.slice(offset)).toMatch(new RegExp(`^${index + 1} 0 obj`)));
  });
  it("wraps long lines, preserves blank lines, and paginates long CVs", () => {
    expect(wrapCvText("a".repeat(170)).every((line) => line.length <= 79)).toBe(true);
    expect(wrapCvText("Name\n\nExperience")).toEqual(["Name", "", "Experience"]);
    const pdf = new TextDecoder().decode(buildCvPdf(Array.from({ length: 102 }, (_, i) => `Line ${i}`).join("\n")));
    expect(pdf).toContain("/Count 2");
    expect(pdf).toContain("(Line 101)");
  });
  it("supports smart punctuation without losing unsupported script silently", () => {
    expect(new TextDecoder().decode(buildCvPdf("Résumé • “Work” — 2026"))).toContain("\\225");
    expect(() => buildCvPdf("اردو")).toThrow("Print / Save as PDF");
  });
  it("rejects empty and oversized CV text", () => {
    expect(cvSchema.safeParse({ title: "CV", body_text: " " }).success).toBe(false);
    expect(cvSchema.safeParse({ title: "CV", body_text: "a".repeat(50001) }).success).toBe(false);
  });
});
