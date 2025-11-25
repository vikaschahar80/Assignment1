import type { Express } from "express";
import { createServer, type Server } from "http";
import { continueWriting } from "./lib/gemini";
import { continueWritingRequestSchema, type ContinueWritingResponse } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Text Continuation Endpoint
  app.post("/api/continue-writing", async (req, res) => {
    try {
      // Validate request body
      const validation = continueWritingRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
      }

      const { text } = validation.data;

      // Generate AI continuation
      const continuation = await continueWriting(text);

      const response: ContinueWritingResponse = {
        continuation,
      };

      res.json(response);
    } catch (error) {
      console.error("Continue writing error:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred";

      res.status(500).json({
        error: "AI generation failed",
        message: errorMessage,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
