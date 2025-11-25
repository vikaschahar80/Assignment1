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
  },
  // Global event handlers - handle UPDATE_CONTENT in all states
  on: {
    UPDATE_CONTENT: {
      actions: assign({
        editorContent: ({ event }) => event.content,
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
