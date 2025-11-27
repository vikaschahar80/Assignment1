import { createMachine, assign } from "xstate";
import type { EditorContext, EditorEvent } from "@shared/schema";

export const editorMachine = createMachine({
  id: "editor",
  initial: "idle",
  types: {} as {
    context: EditorContext;
    events: EditorEvent;
  },
  context: {
    editorContent: "",
    aiGeneratedText: "",
    error: null,
    lastRequestTime: null,
    savedDocuments: [],
    aiProvider: "gemini" as const,
  },
  // Global event handlers - handle UPDATE_CONTENT in all states
  on: {
    UPDATE_CONTENT: {
      actions: assign({
        editorContent: ({ event }) => event.content,
      }),
    },
    SAVE_DOCUMENT: {
      actions: assign({
        savedDocuments: ({ context, event }) =>
          event.content.trim().length
            ? [...context.savedDocuments, event.content]
            : context.savedDocuments,
        editorContent: () => "",
      }),
    },
    HYDRATE_SAVED: {
      actions: assign({
        savedDocuments: ({ event }) => event.documents ?? [],
      }),
    },
    SWITCH_AI_PROVIDER: {
      actions: assign({
        aiProvider: ({ event }) => event.provider,
      }),
    },
    DELETE_DOCUMENT: {
      actions: assign({
        savedDocuments: ({ context, event }) =>
          context.savedDocuments.filter((_, idx) => idx !== event.index),
      }),
    },
  },
  states: {
    idle: {
      on: {
        CONTINUE_WRITING: {
          target: "loadingAI",
          guard: ({ context }) => context.editorContent.trim().length > 0,
        },
      },
    },
    loadingAI: {
      on: {
        AI_SUCCESS: {
          target: "idle",
          actions: assign({
            aiGeneratedText: ({ event }) => event.data,
            error: null,
            lastRequestTime: () => Date.now(),
          }),
        },
        AI_ERROR: {
          target: "error",
          actions: assign({
            error: ({ event }) => event.error,
            lastRequestTime: () => Date.now(),
          }),
        },
      },
    },
    error: {
      on: {
        CONTINUE_WRITING: {
          target: "loadingAI",
          guard: ({ context }) => context.editorContent.trim().length > 0,
        },
        CLEAR_ERROR: {
          target: "idle",
          actions: assign({
            error: null,
          }),
        },
      },
      after: {
        5000: {
          target: "idle",
          actions: assign({
            error: null,
          }),
        },
      },
    },
  },
});
