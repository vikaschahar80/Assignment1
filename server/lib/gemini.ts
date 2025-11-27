import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type { AIProvider } from "@shared/schema";

// Initialize AI clients
const geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

/**
 * Generate AI text continuation based on the provided context and provider
 * @param text The existing text content to continue from
 * @param provider The AI provider to use
 * @returns The AI-generated continuation text
 */
export async function continueWriting(text: string, provider: AIProvider = "gemini"): Promise<string> {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot generate continuation for empty text");
    }

    const prompt = `Continue the following text with 2-3 sentences that match the tone and style:

${text}`;

    let continuation = "";

    switch (provider) {
      case "gemini":
        continuation = await generateWithGemini(prompt);
        break;
      case "openai":
        continuation = await generateWithOpenAI(prompt);
        break;
      case "mistral":
        continuation = await generateWithMistral(prompt);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    if (!continuation) {
      throw new Error("No text generated from AI model. The AI may have returned only thoughts without actual content.");
    }

    // Add a space before the continuation if it doesn't start with punctuation
    const needsSpace = continuation && !/^[.,;:!?]/.test(continuation);
    return needsSpace ? ` ${continuation}` : continuation;
  } catch (error) {
    console.error(`${provider} API error:`, error);

    // Provide detailed error messages for better debugging
    if (error instanceof Error) {
      // Check for common API errors
      if (error.message.includes("API key") || error.message.includes("API_KEY")) {
        throw new Error(`Invalid or missing ${provider} API key`);
      }
      if (error.message.includes("quota")) {
        throw new Error("API quota exceeded. Please try again later");
      }
      if (error.message.includes("rate limit")) {
        throw new Error("Rate limit exceeded. Please wait a moment");
      }

      throw new Error(`AI generation failed: ${error.message}`);
    }

    throw new Error("AI generation failed: Unknown error");
  }
}

async function generateWithGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await geminiAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      thinkingConfig: {
        thinkingBudget: 0 // Disable thinking tokens to ensure we get text output
      }
    },
  });

  console.log("Gemini API response candidates:", JSON.stringify(response.candidates, null, 2));

  if (response.text) {
    return response.text.trim();
  } else if (response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      return candidate.content.parts[0].text?.trim() || "";
    }
  }

  throw new Error("No text generated from Gemini");
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful writing assistant that continues text in a natural, coherent way." },
      { role: "user", content: prompt }
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("No text generated from OpenAI");
  }

  return content;
}

async function generateWithMistral(prompt: string): Promise<string> {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not configured");
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-medium",
      messages: [
        { role: "system", content: "You are a helpful writing assistant that continues text in a natural, coherent way." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("No text generated from Mistral");
  }

  return content;
}
