export interface DocumentChunkPayload {
  chunkIndex: number;
  content: string;
  metadata: {
    title: string;
    category: string;
    charCount: number;
  };
}

/**
 * Splits raw document text into overlapping chunks (~1800 characters / ~450 tokens)
 * and prepends a context header so vector search knows which document & category each chunk came from.
 */
export function chunkDocumentText(
  rawText: string,
  options: {
    title: string;
    category: string;
    chunkSize?: number;
    chunkOverlap?: number;
  }
): DocumentChunkPayload[] {
  const {
    title,
    category,
    chunkSize = 1800,
    chunkOverlap = 300,
  } = options;

  const normalized = (rawText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) {
    return [];
  }

  const header = `[Document: ${title} | Category: ${category}]\n`;
  const paragraphs = normalized.split(/\n\n+/);
  const chunks: DocumentChunkPayload[] = [];

  let currentBuffer = "";
  let chunkIndex = 0;

  const flushChunk = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const fullContent = `${header}${trimmed}`;
    chunks.push({
      chunkIndex: chunkIndex++,
      content: fullContent,
      metadata: {
        title,
        category,
        charCount: fullContent.length,
      },
    });
  };

  for (const para of paragraphs) {
    if ((currentBuffer + "\n\n" + para).length <= chunkSize) {
      currentBuffer = currentBuffer ? `${currentBuffer}\n\n${para}` : para;
    } else {
      if (currentBuffer) {
        flushChunk(currentBuffer);
        // Keep trailing overlap from previous buffer
        const overlapSlice = currentBuffer.slice(
          Math.max(0, currentBuffer.length - chunkOverlap)
        );
        currentBuffer = `${overlapSlice}\n\n${para}`;
      } else {
        // Single paragraph is larger than chunkSize; slice it directly
        let start = 0;
        while (start < para.length) {
          const slice = para.slice(start, start + chunkSize);
          flushChunk(slice);
          if (start + chunkSize >= para.length) break;
          start += chunkSize - chunkOverlap;
        }
        currentBuffer = "";
      }
    }
  }

  if (currentBuffer.trim()) {
    flushChunk(currentBuffer);
  }

  return chunks;
}
