import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";

interface ProseMirrorEditorProps {
  onContentChange?: (content: string) => void;
  onContinueWriting?: () => void;
  className?: string;
}

export interface ProseMirrorEditorHandle {
  insertText: (text: string) => void;
  getContent: () => string;
  focus: () => void;
}

const ProseMirrorEditor = forwardRef<ProseMirrorEditorHandle, ProseMirrorEditorProps>(
  ({ onContentChange, onContinueWriting, className }, ref) => {
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
      focus: () => {
        viewRef.current?.focus();
      },
    }));

    useEffect(() => {
      if (!editorRef.current) return;

      // Define custom schema based on basic schema
      const customSchema = new Schema({
        nodes: basicSchema.spec.nodes,
        marks: basicSchema.spec.marks,
      });

      // Create separate keymaps to avoid override issues
      // Custom keymap should come first to take precedence
      const customKeymap = keymap({
        "Mod-Enter": () => {
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
