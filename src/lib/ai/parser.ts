import Papa from "papaparse";

/**
 * Extracts plain text from uploaded files (PDF, DOCX, CSV, TXT, MD, JSON)
 * in a manner compatible with Next.js & Cloudflare Workers.
 */
export async function extractTextFromBuffer(
  buffer: ArrayBuffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const lowerMime = (mimeType || "").toLowerCase();
  const lowerName = (fileName || "").toLowerCase();

  // 1. CSV Spreadsheets
  if (lowerMime.includes("csv") || lowerName.endsWith(".csv")) {
    const csvText = new TextDecoder("utf-8").decode(buffer);
    const parsed = Papa.parse<Record<string, unknown>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.data && parsed.data.length > 0) {
      const formattedRows = parsed.data.map((row, idx) => {
        const pairs = Object.entries(row)
          .filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== "")
          .map(([key, val]) => `${key.trim()}: ${String(val).trim()}`);
        return `Row ${idx + 1}: ${pairs.join(" | ")}`;
      });
      return formattedRows.join("\n");
    }
    return csvText;
  }

  // 2. Plain Text, Markdown, JSON
  if (
    lowerMime.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".json")
  ) {
    return new TextDecoder("utf-8").decode(buffer);
  }

  // 3. Word Documents (.docx)
  if (
    lowerMime.includes("wordprocessingml") ||
    lowerMime.includes("msword") ||
    lowerName.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      if (result.value && result.value.trim()) {
        return result.value.trim();
      }
    } catch (err) {
      console.warn("DOCX extraction warning:", err);
    }
  }

  // 4. PDF Documents (.pdf) via unpdf (Edge & Cloudflare Worker safe)
  if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) {
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      if (text && text.trim()) {
        return text.trim();
      }
    } catch (err) {
      console.warn("PDF extraction warning:", err);
    }
  }

  // 5. Fallback UTF-8 decode for printable ASCII/text segments
  try {
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const printable = raw.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ").replace(/\s{3,}/g, " ").trim();
    if (printable.length > 20) {
      return printable;
    }
  } catch {}

  return "";
}
