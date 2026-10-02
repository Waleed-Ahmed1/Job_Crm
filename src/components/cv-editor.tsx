"use client";
import { useEffect, useState } from "react";
import { Download, FilePlus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EditableCv } from "@/lib/cv";
import { cvSchema } from "@/lib/cv";
import { buildCvPdf } from "@/lib/cv-pdf";
const blank = { title: "", body_text: "" };
export function CvEditor({ disabled }: { disabled?: boolean }) {
  const [items, setItems] = useState<EditableCv[]>([]);
  const [selected, setSelected] = useState<EditableCv | null>(null);
  const [draft, setDraft] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!disabled);
  const [message, setMessage] = useState("");
  const dirty = draft.title !== (selected?.title ?? "") || draft.body_text !== (selected?.body_text ?? "");
  useEffect(() => {
    if (disabled) return;
    const controller = new AbortController();
    fetch("/api/cvs", { signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load CVs.");
      setItems(data);
    }).catch((error: Error) => { if (error.name !== "AbortError") setMessage(error.message); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [disabled]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function select(item: EditableCv | null) {
    if (dirty && !confirm("Discard your unsaved CV changes?")) return;
    setSelected(item); setDraft(item ? { title: item.title, body_text: item.body_text } : blank); setMessage("");
  }
  async function upload(file?: File) {
    if (!file) return;
    if (!/\.txt$/i.test(file.name) || file.size > 200000) { setMessage("Upload a UTF-8 .txt file up to 200 KB."); return; }
    if (dirty && !confirm("Replace your unsaved text with this file?")) return;
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
      if (!text.trim() || text.length > 50000 || text.includes("\u0000")) throw new Error("Use a non-empty text CV up to 50,000 characters.");
      setSelected(null); setDraft({ title: file.name.replace(/\.txt$/i, "").slice(0, 100), body_text: text });
      setMessage("File loaded. Review the text and save your CV.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not read text file."); }
  }
  async function save() {
    const parsed = cvSchema.safeParse(draft);
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? "Review your CV."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch(selected ? `/api/cvs/${selected.id}` : "/api/cvs", {
        method: selected ? "PUT" : "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...parsed.data, ...(selected ? { updated_at: selected.updated_at } : {}) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save CV.");
      setSelected(data); setDraft({ title: data.title, body_text: data.body_text });
      setItems((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      setMessage("CV saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save CV."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!selected || !confirm(`Delete "${selected.title}"? This also discards unsaved edits.`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/cvs/${selected.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete CV.");
      setItems((current) => current.filter((item) => item.id !== selected.id));
      setSelected(null); setDraft(blank); setMessage("CV deleted.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete CV."); }
    finally { setBusy(false); }
  }
  function download() {
    try {
      const pdf = buildCvPdf(draft.body_text);
      const url = URL.createObjectURL(new Blob([new Uint8Array(pdf)], { type: "application/pdf" }));
      const link = document.createElement("a"); link.href = url;
      link.download = `${draft.title.replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "CV"}.pdf`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("PDF downloaded from the current text, including unsaved edits.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create PDF."); }
  }
  return <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
    <Card className="cv-controls"><CardContent className="space-y-4 p-5"><Button variant="outline" className="w-full" disabled={disabled || busy} onClick={() => select(null)}><FilePlus />New CV</Button><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-sm"><Upload className="size-4" />Upload .txt<input aria-label="Upload text CV" className="sr-only" type="file" accept=".txt,text/plain" disabled={disabled || busy} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} /></label><p className="text-xs leading-5 text-muted-foreground">Use UTF-8 plain text (.txt). Copy text from Word or your existing CV. Use headings such as EXPERIENCE, EDUCATION, and SKILLS. Tables and images are omitted.</p><div className="space-y-2">{loading ? <p className="text-sm">Loading CVs...</p> : items.length === 0 ? <p className="text-sm text-muted-foreground">No saved CVs yet.</p> : items.map((item) => <button type="button" key={item.id} disabled={busy} onClick={() => select(item)} className={`w-full rounded-lg p-3 text-left text-sm ${selected?.id === item.id ? "bg-primary/10 text-primary" : "bg-muted"}`}><span className="block truncate font-medium">{item.title}</span><span className="text-xs">{new Date(item.updated_at).toLocaleDateString()}</span></button>)}</div></CardContent></Card>
    <Card><CardContent className="space-y-5 p-5"><div className="cv-controls space-y-2"><Label htmlFor="cv-title">CV name</Label><Input id="cv-title" value={draft.title} maxLength={100} disabled={disabled || busy} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="My general CV" /></div><div className="cv-controls space-y-2"><Label htmlFor="cv-text">CV text {dirty ? "· Unsaved changes" : ""}</Label><Textarea id="cv-text" value={draft.body_text} maxLength={50000} disabled={disabled || busy} onChange={(event) => setDraft({ ...draft, body_text: event.target.value })} className="min-h-[460px] font-mono text-sm leading-6" placeholder={"YOUR NAME\nEmail | Phone | Location\n\nSUMMARY\n\nEXPERIENCE\n\nEDUCATION\n\nSKILLS"} /></div><div className="cv-controls flex flex-wrap gap-2"><Button disabled={disabled || busy || !dirty} onClick={save}><Save />{busy ? "Saving..." : "Save CV"}</Button><Button variant="outline" disabled={disabled || busy || !draft.body_text.trim()} onClick={download}><Download />Download PDF</Button><Button variant="outline" disabled={disabled || busy || !draft.body_text.trim()} onClick={() => window.print()}>Print / Save as PDF</Button>{selected ? <Button variant="ghost" disabled={disabled || busy} onClick={remove}><Trash2 />Delete</Button> : null}</div>{message ? <p role="status" className="cv-controls rounded-lg bg-muted p-3 text-sm">{message}</p> : null}<div className="cv-controls border-t pt-4"><h2 className="mb-3 font-medium">Preview</h2><p className="mb-3 text-xs text-muted-foreground">PDF uses selectable text in a single column. Direct download supports English and Western European characters; use Print / Save as PDF for other scripts. This layout helps parsers read the text, but cannot guarantee an ATS score.</p></div><article className="cv-preview whitespace-pre-wrap break-words rounded-lg border bg-white p-6 font-mono text-sm leading-6">{draft.body_text || "Your CV preview appears here."}</article></CardContent></Card>
  </div>;
}
