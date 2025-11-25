## Design System
- Establish CSS variables for color, typography, spacing, radius and shadow tokens in `frontend/src/styles/tokens.css` and load in `main.jsx`.
- Colors: accessible palette meeting WCAG AA (≥4.5:1) for text and controls. Provide light theme tokens (bg, surface, text, subdued, primary, danger, success, focus) and respect `prefers-color-scheme` for future dark mode.
- Typography: base 16px, scale (12/14/16/18/24/32), semantic classes for headings/body/label. Consistent line-height and letter-spacing.
- Spacing: 4/8px scale (`--space-1`…`--space-6`) with layout grid rules.
- Motion: define transition durations/easings; honor `prefers-reduced-motion` to disable animations for users who prefer it.

## Layout & Responsiveness
- Convert the app shell to a responsive two‑pane layout: collapsible sidebar on small screens, content area flexing to fill.
- Add a top app bar in mobile with a menu button to open the sidebar (ARIA controlled). Breakpoints at 480/768/1024.
- Ensure components are keyboard navigable and maintain existing state management.

## Core Components
- Sidebar (update in `components/Sidebar.jsx/.css`):
  - List items with clear visual hierarchy (title prominent, message count secondary).
  - Inline controls: Edit (pencil icon button) and Delete (trash icon button) with focus styles.
  - Keyboard: Up/Down to move, Enter to select, E to edit, Delete to delete, Esc to cancel.
- Conversation Title Editing (`components/ConversationTitleEdit.jsx`):
  - Trigger via edit icon; shows a text field with Save/Cancel.
  - Validation: 1–50 chars; letters, numbers, spaces and basic punctuation (.,-_). Trim whitespace; show inline error message.
  - Accessibility: labeled input, error `aria-live="polite"`, focus returns to trigger on cancel/save.
  - API: `PATCH /api/conversations/{id}/title` (new) in backend; add `api.updateConversationTitle(id, title)`.
- Delete Conversation (`components/ConfirmDialog.jsx`):
  - Visible delete control; modal with trap focus, `aria-modal`, `role="dialog"`, labeled title/description.
  - Actions: Confirm/Delete (danger) and Cancel; Esc closes; Enter confirms.
  - API: `DELETE /api/conversations/{id}` (new) in backend; add `api.deleteConversation(id)`.
- Toasts (`components/Toast.jsx` + `hooks/useToasts.js`):
  - Success/error feedback; `aria-live="polite"`; timeouts; focusable dismiss button.
- Chat Interface polish (`components/ChatInterface.jsx/.css`):
  - Message bubbles with clearer spacing and readable markdown styles.
  - Loading skeletons for Stage 1/2/3 that respect reduced motion.
  - Tabbed views for stage outputs maintain current logic but with consistent styles.

## Animations & Transitions
- Smooth hover/focus states, list item selection, modal open/close (opacity/transform with 150–200ms). Prefer reduced motion to turn off.

## Accessibility
- Add roles/labels to interactive elements; ensure tab order logical.
- Focus outlines conform to contrast; custom focus ring token.
- Live regions for streaming updates in ChatInterface; ensure screen reader announcements for stage completion.
- Add a “Skip to content” link.

## Backend API Extensions
- Implement `DELETE /api/conversations/{id}` using a new `storage.delete_conversation(id)`.
- Implement `PATCH /api/conversations/{id}/title` calling `storage.update_conversation_title(id, title)` with server-side validation.
- CORS remains open to Vite ports; reuse existing patterns in `backend/main.py`.

## Frontend API Updates
- In `frontend/src/api.js`: add `updateConversationTitle(id, title)` and `deleteConversation(id)`.
- Wire Sidebar and new components to call these methods and update lists optimistically with rollback on error.

## Testing & Coverage
- Add Vitest + React Testing Library.
- Configure coverage thresholds to 100% for new components in `vitest.config.ts`.
- Tests:
  - ConversationTitleEdit: validation rules, keyboard accessibility, save/cancel flows, focus management.
  - ConfirmDialog: focus trap, Enter/Esc behaviors, ARIA attributes, callback invocation.
  - Sidebar: keyboard navigation, edit/delete controls, selection state.
  - Toast: live region announcements and dismissal.
  - API: mock fetch and assert calls for title update/delete.
- Optionally add `jest-axe` for a11y lint on components.

## Performance & Cross‑Browser
- Optimize list rendering and markdown with memoization; avoid unnecessary reflows.
- Use CSS only for simple transitions; avoid heavy JS animations.
- Verify on latest Chrome, Firefox, Safari, Edge. Add autoprefixer via PostCSS if necessary.

## Style Guide
- Create `frontend/STYLEGUIDE.md` documenting tokens, components (usage, states, a11y notes), spacing/typography rules, and motion guidelines.

## Implementation Steps
1. Add design tokens and global styles; update App shell.
2. Build `ConversationTitleEdit`, `ConfirmDialog`, `Toast` components and wire into `Sidebar`.
3. Extend backend with `DELETE` and `PATCH` endpoints; update `api.js`.
4. Polish ChatInterface and stage views with modern styles and skeletons.
5. Implement accessibility roles/focus management and reduced motion handling.
6. Add tests with 100% coverage for new components; set CI thresholds.
7. Document patterns in the style guide.
8. Run lint and format; validate in browsers and mobile.

## Acceptance Criteria
- Meets all listed UX/UI, accessibility, performance and testing requirements.
- No regressions in existing functionality; conversations can be created, viewed, streamed and titled.
- 100% coverage on new components and passing lint/a11y checks.
