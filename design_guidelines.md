# Design Guidelines: AI-Assisted Text Editor

## Design Approach
**System-Based Approach**: Drawing from Linear and Notion's clean, productivity-focused design philosophy. This editor prioritizes distraction-free writing with clear, minimal UI that highlights the content and AI features.

## Core Design Principles
1. **Content-First**: Editor content is the hero - UI chrome should recede
2. **State Clarity**: Loading and error states must be immediately obvious
3. **Professional Minimalism**: Clean lines, generous whitespace, no visual noise

---

## Typography System

**Editor Content**:
- Font: 'Inter' or 'SF Pro Text' from Google Fonts
- Editor text: 16px / 1.6 line-height, weight 400
- Comfortable reading width: max 65-75 characters per line

**UI Elements**:
- Button text: 14px, weight 500
- Error messages: 14px, weight 400
- Loading text: 14px, weight 400

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 3, 4, 6, 8, 12, 16
- Consistent rhythm: p-4, gap-3, m-6 for most elements
- Generous padding around editor: p-8 or p-12

**Editor Container**:
- Centered layout with max-width constraint (max-w-4xl)
- Full viewport height for editor area
- 60-80px top padding from viewport edge

**Button Placement**:
- Fixed position: bottom-right corner of viewport
- Distance from edges: 24px (m-6)
- Floats above editor with subtle elevation

---

## Component Library

### Primary Editor Area
- Clean white/neutral background for writing surface
- Subtle border (1px, neutral-200 equivalent)
- Rounded corners: rounded-lg
- Minimum height: 400px, expands to fill available space
- Focus state: subtle border color shift (no heavy outlines)
- Padding inside editor: p-6 to p-8

### Continue Writing Button
- Size: px-6 py-3 (comfortable click target)
- Rounded: rounded-lg
- Typography: 14px, weight 500, letter-spacing tight
- Icon + Text combination (Sparkle or Wand icon from Heroicons)
- Icon position: left of text, gap-2
- Shadow: Soft elevation shadow (shadow-lg)
- Include keyboard hint in tooltip: "⌘+Enter"

### Loading State
- Replace button content with spinner + "Generating..." text
- Spinner: 16px, positioned where icon was
- Button remains in same position (no layout shift)
- Disabled state styling during loading

### Error State
- Toast notification: top-right of viewport, 24px from edges
- Size: min-w-80, p-4
- Rounded: rounded-lg
- Typography: 14px, includes error icon (Alert Circle from Heroicons)
- Auto-dismiss after 5 seconds or manual close button
- Subtle entrance/exit animation

---

## Visual Hierarchy

**Editor Focus**:
- Editor occupies 85% of visual weight
- Button is present but unobtrusive (10% visual weight)
- Error/loading states command attention when active (5% baseline)

**State Indicators**:
- Idle: Button has standard appearance
- Loading: Button shows spinner, slightly reduced opacity
- Error: Toast appears with higher visual priority than button
- Success: Brief success indicator (optional checkmark) before returning to idle

---

## Accessibility

- Editor has proper ARIA labels
- Button clearly labeled for screen readers
- Keyboard shortcut (Cmd/Ctrl+Enter) for Continue Writing
- Focus management: after AI insertion, cursor remains in editor
- Error messages use ARIA live regions
- Sufficient color contrast for all text (WCAG AA minimum)

---

## Interaction Patterns

**Editor Behavior**:
- ProseMirror handles all text manipulation
- Smooth scrolling to newly inserted content
- Cursor placement after AI insertion: end of new content

**Button Behavior**:
- Disabled when editor is empty
- Disabled during loading state
- Hover state: subtle lift (transform scale)

**Loading Experience**:
- Immediate feedback (<100ms from click)
- Spinner rotates smoothly
- Button text changes to "Generating..."
- No blocking overlay - user can still read content

---

## Layout Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │     ProseMirror Editor            │  │
│  │     (Full height, centered,       │  │
│  │      max-width constrained)       │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│                    [Continue Writing ✨] │ ← Bottom-right fixed
└─────────────────────────────────────────┘

Error toast appears top-right when triggered
```

---

## Images
No images required for this application interface.