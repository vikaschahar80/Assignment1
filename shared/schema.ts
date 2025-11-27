import { z } from "zod";

// AI Text Generation Types
export const continueWritingRequestSchema = z.object({
  text: z.string().min(1, "Text content is required"),
  provider: z.enum(["gemini", "openai", "mistral"]).optional().default("gemini"),
});

export const continueWritingResponseSchema = z.object({
  continuation: z.string(),
});

export type ContinueWritingRequest = z.infer<typeof continueWritingRequestSchema>;
export type ContinueWritingResponse = z.infer<typeof continueWritingResponseSchema>;

// ProseMirror Document Types
export interface EditorDocumentNode {
  type: string;
  content?: EditorDocumentNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
}

export interface ProseMirrorDocument {
  type: "doc";
  content: EditorDocumentNode[];
}

// AI Provider Types
export type AIProvider = "gemini" | "openai" | "mistral";

// XState Context Types
export interface EditorContext {
  editorContent: string;
  aiGeneratedText: string;
  error: string | null;
  lastRequestTime: number | null;
  savedDocuments: string[];
  aiProvider: AIProvider;
}

export type EditorEvent =
  | { type: "CONTINUE_WRITING" }
  | { type: "AI_SUCCESS"; data: string }
  | { type: "AI_ERROR"; error: string }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_CONTENT"; content: string }
  | { type: "SAVE_DOCUMENT"; content: string }
  | { type: "HYDRATE_SAVED"; documents: string[] }
  | { type: "DELETE_DOCUMENT"; index: number }
  | { type: "SWITCH_AI_PROVIDER"; provider: AIProvider };
