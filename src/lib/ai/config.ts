import { createGoogleGenerativeAI } from "@ai-sdk/google";

const PLACEHOLDER_KEY = "YOUR_GOOGLE_GEMINI_API_KEY_HERE";

export function isGeminiApiKeyConfigured(): boolean {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  return Boolean(key && key !== PLACEHOLDER_KEY && !key.startsWith("YOUR_"));
}

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || PLACEHOLDER_KEY,
});

// Fast, free-tier chat model with 1M context window & tool calling
export const copilotChatModel = google("gemini-2.5-flash");

// Free-tier 768-dimension embedding model
export const copilotEmbeddingModel = google.textEmbeddingModel(
  "text-embedding-004"
);
