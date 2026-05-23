"use client";

import { useState, useCallback } from "react";
import { fuzzyFindChampion } from "@/lib/data";
import { parseRosterText } from "@/lib/roster";
import type { RosterEntry } from "@/lib/types";

type TesseractWorker = {
  recognize: (image: File | Blob | string) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<void>;
};
type TesseractAPI = {
  createWorker: (
    lang?: string,
    oem?: unknown,
    opts?: { logger?: (m: { status?: string; progress?: number }) => void }
  ) => Promise<TesseractWorker>;
};

type Status = "idle" | "loading" | "ocr" | "parsed" | "error";

export function ScreenshotUpload({
  onAdd,
}: {
  onAdd: (entries: RosterEntry[]) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [parsedText, setParsedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles(arr);
    setPreviewUrls(arr.map((f) => URL.createObjectURL(f)));
    setStatus("idle");
    setParsedText("");
    setError(null);
  }, []);

  async function runOCR() {
    if (files.length === 0) return;
    setStatus("loading");
    setError(null);
    try {
      // Lazy-load Tesseract from CDN at runtime, bypassing webpack static analysis.
      const dynImport = new Function("u", "return import(u)") as (u: string) => Promise<unknown>;
      const Tesseract = (await dynImport(
        "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/+esm"
      )) as TesseractAPI;
      const worker = await Tesseract.createWorker("eng", undefined, {
        logger: (m: { status?: string; progress?: number }) => {
          if (m.progress != null) setProgress(Math.round(m.progress * 100));
        },
      });
      setStatus("ocr");
      let all = "";
      for (const f of files) {
        const { data } = await worker.recognize(f);
        all += data.text + "\n";
      }
      await worker.terminate();

      // Light cleanup: keep lines that look like champion names + stats
      const lines = all
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && l.length >= 3 && /[A-Za-z]/.test(l));

      // Try to fuzzy-match each line to a champion. Lines that match become
      // roster paste-text format. Lines that don't are dropped.
      const matched: string[] = [];
      for (const l of lines) {
        const ch = fuzzyFindChampion(l);
        if (ch) {
          // Try to extract stars / rank tokens from the line
          const tokens = l.match(/\b([1-9]\*|[Rr]\d|r\d|sig\d+|[67]r\d)\b/g) || [];
          matched.push([ch.title, ...tokens].join(" "));
        }
      }
      const text = matched.join("\n");
      setParsedText(text);
      setStatus("parsed");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  function applyParsed() {
    const { ok } = parseRosterText(parsedText);
    onAdd(ok);
    setParsedText("");
    setFiles([]);
    setPreviewUrls([]);
    setStatus("idle");
  }

  return (
    <div className="bg-ink-soft border border-ink-mid rounded-lg p-4">
      <h2 className="font-display text-sm uppercase tracking-wide text-chrome-soft mb-2">
        Upload screenshots
      </h2>
      <p className="text-xs text-chrome-soft mb-3">
        Drop MCOC screenshots in here. Browser OCR tries to match champions and produce paste-text.
        For higher accuracy: drop screenshots into{" "}
        <code className="text-cosmic">~/Downloads/mcoc-roster-screenshots</code> and ask Claude to vision-parse them.
      </p>

      <label
        htmlFor="ss-upload"
        className="block border-2 border-dashed border-ink-mid rounded-lg p-6 text-center cursor-pointer hover:border-chrome-soft transition-colors"
      >
        <input
          id="ss-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        {files.length === 0 ? (
          <div className="text-chrome-soft text-sm">
            Click or drop screenshots (PNG / JPG)
          </div>
        ) : (
          <div className="text-sm text-chrome">{files.length} file(s) selected</div>
        )}
      </label>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
          {previewUrls.map((u, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={u} alt="" className="w-full h-16 object-cover rounded border border-ink-mid" />
          ))}
        </div>
      )}

      {files.length > 0 && status !== "parsed" && (
        <button
          onClick={runOCR}
          disabled={status === "loading" || status === "ocr"}
          className="mt-3 px-3 py-1.5 bg-tech text-ink rounded font-semibold text-sm disabled:opacity-50"
        >
          {status === "loading" && "Loading Tesseract..."}
          {status === "ocr" && `OCR ${progress}%`}
          {(status === "idle" || status === "error") && "Run browser OCR"}
        </button>
      )}

      {status === "parsed" && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-chrome-soft uppercase tracking-wide">
            OCR result — review before applying
          </div>
          <textarea
            value={parsedText}
            onChange={(e) => setParsedText(e.target.value)}
            rows={8}
            className="w-full bg-ink border border-ink-mid rounded px-2 py-2 text-xs font-mono focus:outline-none focus:border-chrome-soft"
          />
          <div className="flex gap-2">
            <button onClick={applyParsed} className="px-3 py-1.5 bg-cosmic text-ink rounded font-semibold text-sm">
              Apply {parsedText.split("\n").filter(Boolean).length} matches
            </button>
            <button
              onClick={() => { setStatus("idle"); setParsedText(""); }}
              className="px-3 py-1.5 border border-chrome-soft text-chrome rounded text-sm"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-skill text-xs">OCR failed: {error}</div>
      )}
    </div>
  );
}
