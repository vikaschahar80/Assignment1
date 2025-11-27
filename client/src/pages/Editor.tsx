import { useRef, useEffect, useState } from "react";
import { useMachine } from "@xstate/react";
import { editorMachine } from "@/lib/editorMachine";
import ProseMirrorEditor, { ProseMirrorEditorHandle } from "@/components/ProseMirrorEditor";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Save, Trash2, History, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import type { ContinueWritingResponse, AIProvider } from "@shared/schema";

export default function Editor() {
  const [state, send] = useMachine(editorMachine);
  const editorRef = useRef<ProseMirrorEditorHandle>(null);
  const { toast } = useToast();
  const [activeSavedIndex, setActiveSavedIndex] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");

  const isLoading = state.matches("loadingAI");
  const hasError = state.matches("error");
  const isIdle = state.matches("idle");
  const hasContent = state.context.editorContent.trim().length > 0;
  const hasSaved = state.context.savedDocuments.length > 0;

  const STORAGE_KEY = "smarteditor_saved_sessions";

  // Load saved sessions from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        send({ type: "HYDRATE_SAVED", documents: parsed });
      }
    } catch {
      // ignore malformed data
    }
    // we only want this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist saved sessions to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state.context.savedDocuments),
      );
    } catch {
      // ignore quota / serialization errors
    }
  }, [state.context.savedDocuments]);

  // Handle save: store current text and open a fresh editor box
  const handleSave = () => {
    const currentContent =
      editorRef.current?.getContent() ?? state.context.editorContent;

    if (!currentContent.trim()) {
      toast({
        title: "Nothing to save",
        description: "Write something before saving your session.",
        variant: "destructive",
      });
      return;
    }

    // If we're editing an existing saved chat, overwrite it instead of adding new
    if (
      activeSavedIndex !== null &&
      activeSavedIndex >= 0 &&
      activeSavedIndex < state.context.savedDocuments.length
    ) {
      const updated = [...state.context.savedDocuments];
      updated[activeSavedIndex] = currentContent;
      send({ type: "HYDRATE_SAVED", documents: updated });

      // Clear editor and reset active index after updating
      editorRef.current?.setContent("");
      send({ type: "UPDATE_CONTENT", content: "" });
      setActiveSavedIndex(null);

      toast({
        title: "Session updated",
        description: "Your changes have been saved to the existing chat.",
      });
      return;
    }

    // Otherwise, save as a new chat and clear the editor
    send({ type: "SAVE_DOCUMENT", content: currentContent });
    editorRef.current?.setContent("");
    setActiveSavedIndex(null);

    toast({
      title: "Session saved",
      description: "Your writing has been saved. You can continue in a fresh page.",
    });
  };

  // Load a saved session into the main editor
  const handleOpenSaved = (index: number) => {
    const doc = state.context.savedDocuments[index];
    if (!doc) return;

    editorRef.current?.setContent(doc);
    send({ type: "UPDATE_CONTENT", content: doc });
    setActiveSavedIndex(index);

    toast({
      title: "Session loaded",
      description: "You can now continue editing this saved session.",
    });
  };

  const handleClear = () => {
    editorRef.current?.setContent("");
    send({ type: "UPDATE_CONTENT", content: "" });
    setActiveSavedIndex(null);
  };

  const handleEditorSurfaceMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const target = event.target as HTMLElement;
    const isEditorContent = target.closest('[data-testid="prosemirror-editor"]');
    if (!isEditorContent) {
      event.preventDefault();
      editorRef.current?.focus();
    }
  };

  // Handle AI provider switch
  const handleProviderSwitch = (provider: string) => {
    send({ type: "SWITCH_AI_PROVIDER", provider: provider as AIProvider });
    toast({
      title: "AI Provider Changed",
      description: `Switched to ${provider.toUpperCase()}`,
    });
  };

  const handleDeleteSaved = (index: number) => {
    // Adjust active index if needed
    if (activeSavedIndex !== null) {
      if (index === activeSavedIndex) {
        setActiveSavedIndex(null);
      } else if (index < activeSavedIndex) {
        setActiveSavedIndex(activeSavedIndex - 1);
      }
    }

    send({ type: "DELETE_DOCUMENT", index });
  };

  // Calculate word count
  const getWordCount = (text: string): number => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  };

  const wordCount = getWordCount(state.context.editorContent);

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
        { text: state.context.editorContent, provider: state.context.aiProvider },
        { parseJson: true },
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

  const [documentTitle, setDocumentTitle] = useState("Untitled Document");

  return (
    <div className="min-h-full">
      <div className="flex justify-center px-4 py-10 lg:py-14">
        <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-[32px] border border-white/60 bg-white/95 shadow-[0_35px_80px_rgba(84,87,207,0.25)] backdrop-blur-sm p-8 flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Document title
                </label>
                <input
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-700 shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Untitled Document"
                />
              </div>
              <div className="rounded-full bg-indigo-50/80 px-4 py-2 text-xs font-semibold text-indigo-600 shadow-inner border border-indigo-100">
                Words
                <span className="ml-2 text-base font-bold text-slate-900">
                  {wordCount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-[#dfe6fb] bg-gradient-to-b from-white to-[#f7f8ff] p-5 shadow-inner">
              <div
                className="rounded-[20px] border border-[#e9ecff] bg-white/95 min-h-[430px] cursor-text"
                onMouseDown={handleEditorSurfaceMouseDown}
              >
                <ProseMirrorEditor
                  ref={editorRef}
                  onContentChange={handleContentChange}
                  onContinueWriting={handleContinueWriting}
                  className="min-h-[430px] leading-relaxed px-3 py-4"
                  fontSize={fontSize}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm flex flex-wrap items-center gap-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                Format
              </p>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-xs font-semibold"
                onClick={() => editorRef.current?.toggleBold()}
              >
                B
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-xs italic"
                onClick={() => editorRef.current?.toggleItalic()}
              >
                I
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-xs underline"
                onClick={() => editorRef.current?.toggleUnderline()}
              >
                U
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant={fontSize === "sm" ? "default" : "ghost"}
                  className="h-8 w-8 text-[11px]"
                  onClick={() => setFontSize("sm")}
                >
                  A-
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant={fontSize === "md" ? "default" : "ghost"}
                  className="h-8 w-8 text-[11px]"
                  onClick={() => setFontSize("md")}
                >
                  A
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant={fontSize === "lg" ? "default" : "ghost"}
                  className="h-8 w-8 text-[11px]"
                  onClick={() => setFontSize("lg")}
                >
                  A+
                </Button>
              </div>
              <div className="h-6 w-px bg-slate-200 mx-2" />
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                  AI
                </span>
                <Select value={state.context.aiProvider} onValueChange={handleProviderSwitch}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="ml-auto text-xs text-destructive hover:text-destructive"
                onClick={handleClear}
              >
                Clear
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-500">
                Tip: {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"} + Enter to summon AI
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={handleContinueWriting}
                  disabled={isLoading || !hasContent}
                  className="gap-2 rounded-2xl bg-gradient-to-r from-[#6f5bff] to-[#8f7bff] px-6 py-5 text-base font-semibold text-white shadow-lg shadow-indigo-200/70 hover:scale-[1.01] transition"
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
                <Button
                  size="lg"
                  variant="outline"
                  type="button"
                  onClick={handleSave}
                  disabled={!hasContent}
                  className="gap-2 rounded-2xl border-2 border-indigo-100 bg-white px-6 py-5 text-base font-semibold text-indigo-600 shadow-md shadow-indigo-100/70"
                >
                  <Save className="h-4 w-4" />
                  Save Document
                </Button>
                {hasSaved && (
                  <Button
                    size="lg"
                    variant="ghost"
                    type="button"
                    onClick={() => handleOpenSaved(state.context.savedDocuments.length - 1)}
                    className="gap-2 rounded-2xl text-sm text-slate-600"
                  >
                    <History className="h-4 w-4" />
                    Last Saved
                  </Button>
                )}
              </div>
            </div>
          </section>

          <aside className="rounded-[32px] border border-white/60 bg-white/85 shadow-[0_25px_70px_rgba(75,78,172,0.22)] backdrop-blur-sm p-6 flex flex-col">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="text-3xl">📚</span>
              <div>
                <p className="text-base font-semibold text-slate-900">Saved Documents</p>
                <p className="text-xs text-slate-500">Tap to reopen any draft</p>
              </div>
            </div>
            <div className="mt-5 flex-1 overflow-y-auto space-y-4 pr-1">
              {state.context.savedDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 py-12 text-center text-sm text-slate-500 shadow-inner">
                  <span className="text-4xl mb-4">📝</span>
                  <p className="font-medium">No saved documents yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Start writing and save your work!</p>
                </div>
              ) : (
                state.context.savedDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className={`relative rounded-2xl border px-4 py-4 text-sm text-slate-600 shadow-sm hover:shadow-md transition hover:-translate-y-0.5 ${
                      activeSavedIndex === index
                        ? "border-indigo-200 bg-indigo-50/70"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full text-left pr-10"
                      onClick={() => handleOpenSaved(index)}
                    >
                      <div className="whitespace-pre-wrap break-words leading-relaxed line-clamp-6">
                        {doc || "(Empty session)"}
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete saved session"
                      className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-destructive hover:border-destructive transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSaved(index);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>

      {import.meta.env.DEV && (
        <div className="fixed top-24 right-4 text-xs bg-muted px-3 py-1 rounded-md font-mono shadow-sm">
          State: {state.value.toString()}
        </div>
      )}
    </div>
  );
}
