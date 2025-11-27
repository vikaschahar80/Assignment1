import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark } from "prosemirror-commands";

interface ProseMirrorEditorProps {
  onContentChange?: (content: string) => void;
  onContinueWriting?: () => void;
  className?: string;
  fontSize?: "sm" | "md" | "lg";
}

export interface ProseMirrorEditorHandle {
  insertText: (text: string) => void;
  getContent: () => string;
  setContent: (text: string) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  clear: () => void;
  focus: () => void;
}

const ProseMirrorEditor = forwardRef<ProseMirrorEditorHandle, ProseMirrorEditorProps>(
  ({ onContentChange, onContinueWriting, className, fontSize = "md" }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onContentChangeRef = useRef(onContentChange);
    const onContinueWritingRef = useRef(onContinueWriting);

    // Keep refs up to date
    useEffect(() => {
      onContentChangeRef.current = onContentChange;
      onContinueWritingRef.current = onContinueWriting;
    }, [onContentChange, onContinueWriting]);

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        if (!viewRef.current) return;
        
        const { state, dispatch } = viewRef.current;
        const { tr } = state;
        const endPos = state.doc.content.size;
        
        // Insert text at the end of the document
        tr.insertText(text, endPos);
        dispatch(tr);
        
        // Scroll to the newly inserted content
        setTimeout(() => {
          if (viewRef.current) {
            const view = viewRef.current;
            const endCoords = view.coordsAtPos(view.state.doc.content.size);
            if (endCoords) {
              view.dom.scrollTop = endCoords.top - view.dom.offsetTop;
            }
            view.focus();
          }
        }, 50);
      },
      getContent: () => {
        if (!viewRef.current) return "";
        const doc = viewRef.current.state.doc;
        return doc.textContent;
      },
      setContent: (text: string) => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const { state } = view;
        let tr = state.tr;
        tr = tr.delete(0, state.doc.content.size);
        if (text) {
          tr = tr.insertText(text, 0);
        }
        view.dispatch(tr);
      },
      toggleBold: () => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const { state } = view;
        const markType = state.schema.marks.strong;
        if (!markType) return;
        toggleMark(markType)(state, view.dispatch);
        view.focus();
      },
      toggleItalic: () => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const { state } = view;
        const markType = state.schema.marks.em;
        if (!markType) return;
        toggleMark(markType)(state, view.dispatch);
        view.focus();
      },
      toggleUnderline: () => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const { state } = view;
        const markType = (state.schema.marks as any).underline;
        if (!markType) return;
        toggleMark(markType)(state, view.dispatch);
        view.focus();
      },
      clear: () => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const { state } = view;
        let tr = state.tr;
        tr = tr.delete(0, state.doc.content.size);
        view.dispatch(tr);
      },
      focus: () => {
        viewRef.current?.focus();
      },
    }));

    useEffect(() => {
      if (!editorRef.current) return;

      // Define custom schema based on basic schema and add underline support
      const underlineMark = {
        parseDOM: [
          { tag: "u" },
          { style: "text-decoration", getAttrs: (value: string) => value === "underline" && null },
        ],
        toDOM() {
          return ["span", { style: "text-decoration: underline" }, 0];
        },
      };

      const marks =
        (basicSchema.spec.marks as any).addToEnd !== undefined
          ? (basicSchema.spec.marks as any).addToEnd("underline", underlineMark)
          : basicSchema.spec.marks;

      const customSchema = new Schema({
        nodes: basicSchema.spec.nodes,
        marks,
      });

      // Create separate keymaps to avoid override issues
      // Custom keymap should come first to take precedence
      const customKeymap = keymap({
        "Mod-Enter": () => {
          onContinueWritingRef.current?.();
          return true;
        },
        "Mod-Shift-Enter": () => {
          onContinueWritingRef.current?.();
          return true;
        },
      });

      const baseKeys = keymap(baseKeymap);

      // Initialize editor state
      const state = EditorState.create({
        schema: customSchema,
        plugins: [customKeymap, baseKeys],
      });

      // Create editor view
      const view = new EditorView(editorRef.current, {
        state,
        dispatchTransaction: (transaction: Transaction) => {
          const newState = view.state.apply(transaction);
          view.updateState(newState);
          
          // Notify parent of content changes
          if (transaction.docChanged) {
            const content = newState.doc.textContent;
            onContentChangeRef.current?.(content);
          }
        },
        attributes: {
          class: "prose-editor-content focus:outline-none",
          "data-testid": "prosemirror-editor",
        },
      });

      viewRef.current = view;

      // Initialize content state and focus the editor on mount
      setTimeout(() => {
        view.focus();
        // Trigger initial content update to sync XState context
        const initialContent = view.state.doc.textContent;
        onContentChangeRef.current?.(initialContent);
      }, 100);

      // Cleanup
      return () => {
        view.destroy();
      };
    }, []);

    // Update font size when it changes
    useEffect(() => {
      if (!viewRef.current) return;
      const editorDom = viewRef.current.dom;
      if (!editorDom) return;

      // Remove existing font size classes
      editorDom.classList.remove("text-sm", "text-base", "text-lg");
      
      // Add new font size class
      if (fontSize === "sm") {
        editorDom.classList.add("text-sm");
      } else if (fontSize === "lg") {
        editorDom.classList.add("text-lg");
      } else {
        editorDom.classList.add("text-base");
      }
    }, [fontSize]);

    return (
      <div
        ref={editorRef}
        className={className}
        data-testid="editor-container"
      />
    );
  }
);

ProseMirrorEditor.displayName = "ProseMirrorEditor";

export default ProseMirrorEditor;
