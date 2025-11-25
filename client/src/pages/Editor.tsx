import { useRef, useEffect } from "react";
import { useMachine } from "@xstate/react";
import { editorMachine } from "@/lib/editorMachine";
import ProseMirrorEditor, { ProseMirrorEditorHandle } from "@/components/ProseMirrorEditor";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ContinueWritingResponse } from "@shared/schema";

export default function Editor() {
  const [state, send] = useMachine(editorMachine);
  const editorRef = useRef<ProseMirrorEditorHandle>(null);
  const { toast } = useToast();

  const isLoading = state.matches("loadingAI");
  const hasError = state.matches("error");
  const isIdle = state.matches("idle");

  // Handle content changes from the editor
  const handleContentChange = (content: string) => {
    // Update XState context with current editor content
    send({ type: "UPDATE_CONTENT", content });
  };

  // Handle AI text generation
  const handleContinueWriting = async () => {
    if (!state.context.editorContent.trim()) {
      toast({
        title: "Editor is empty",
        description: "Please write some text before using AI continuation.",
        variant: "destructive",
      });
      return;
    }

    send({ type: "CONTINUE_WRITING" });

    try {
      const response = await apiRequest<ContinueWritingResponse>(
        "POST",
        "/api/continue-writing",
        { text: state.context.editorContent }
      );

      if (response.continuation) {
        // Insert the AI-generated text into the editor
        editorRef.current?.insertText(response.continuation);
        send({ type: "AI_SUCCESS", data: response.continuation });
      } else {
        throw new Error("No continuation received from AI");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate text";
      send({ type: "AI_ERROR", error: errorMessage });
      toast({
        title: "AI Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Show error toast when error state is entered
  useEffect(() => {
    if (hasError && state.context.error) {
      toast({
        title: "Error",
        description: state.context.error,
        variant: "destructive",
      });
    }
  }, [hasError, state.context.error]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Editor Area */}
      <div className="flex-1 flex items-start justify-center pt-16 pb-32 px-6">
        <div className="w-full max-w-4xl">
          {/* Editor Container */}
          <div className="bg-card border border-card-border rounded-lg shadow-sm min-h-[500px] p-8 focus-within:border-primary/20 transition-colors">
            <ProseMirrorEditor
              ref={editorRef}
              onContentChange={handleContentChange}
              onContinueWriting={handleContinueWriting}
              className="min-h-[450px] text-base leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Continue Writing Button - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              onClick={handleContinueWriting}
              disabled={isLoading || !state.context.editorContent.trim()}
              className="shadow-lg gap-2 px-6 py-6 text-sm font-medium"
              data-testid="button-continue-writing"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Continue Writing
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Press {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+Enter</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* State Indicator (for debugging) */}
      {import.meta.env.DEV && (
        <div className="fixed top-4 right-4 text-xs bg-muted px-3 py-1 rounded-md font-mono">
          State: {state.value.toString()}
        </div>
      )}
    </div>
  );
}
