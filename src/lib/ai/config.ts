import dns from "node:dns";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Prevent Node.js from stalling on IPv6 resolution for Google APIs on Windows
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

const PLACEHOLDER_KEY = "YOUR_GOOGLE_API_KEY_HERE";

export function isGeminiApiKeyConfigured(): boolean {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  return Boolean(key && key !== PLACEHOLDER_KEY && !key.startsWith("YOUR_"));
}

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || PLACEHOLDER_KEY,
});

// Primary: Gemini Flash-Lite Latest, Secondary: Gemini 3.5 Flash-Lite, Tertiary: Gemini 3 Flash Preview
export const copilotChatModel = google("gemini-flash-lite-latest");
export const copilotFallbackChatModel = google("gemini-3.5-flash-lite");
export const copilotTertiaryChatModel = google("gemini-3-flash-preview");

// Active 768-dimension embedding model
export const copilotEmbeddingModel = google.textEmbeddingModel(
  "gemini-embedding-001"
);
