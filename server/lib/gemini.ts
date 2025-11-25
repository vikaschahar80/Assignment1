import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Generate AI text continuation based on the provided context
 * @param text The existing text content to continue from
 * @returns The AI-generated continuation text
 */
export async function continueWriting(text: string): Promise<string> {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot generate continuation for empty text");
    }

    const prompt = `Continue the following text with 2-3 sentences that match the tone and style:

${text}`;

    // Generate content using the Gemini API
    const response = await ai.models.generateContent({
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
    
    // Extract text from the response
    // The Gemini API returns text in response.text or in candidates[0].content.parts[0].text
    let continuation = "";
    
    if (response.text) {
      continuation = response.text.trim();
    } else if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        continuation = candidate.content.parts[0].text?.trim() || "";
      }
    }
    
    console.log("Extracted continuation:", continuation);
    
    if (!continuation) {
      throw new Error("No text generated from AI model. The AI may have returned only thoughts without actual content.");
    }

    // Add a space before the continuation if it doesn't start with punctuation
    const needsSpace = continuation && !/^[.,;:!?]/.test(continuation);
    return needsSpace ? ` ${continuation}` : continuation;
  } catch (error) {
    console.error("Gemini API error:", error);
    
    // Provide detailed error messages for better debugging
    if (error instanceof Error) {
      // Check for common API errors
      if (error.message.includes("API key") || error.message.includes("API_KEY")) {
        throw new Error("Invalid or missing Gemini API key");
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
