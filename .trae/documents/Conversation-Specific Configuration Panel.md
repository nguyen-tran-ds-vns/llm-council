## Overview

Implement a collapsible configuration sub-panel per conversation to manage council models and chairman model with auto-complete against OpenRouter models, persisted per conversation and applied immediately.

## Backend Changes

1. Conversation schema:

* Extend stored JSON with `council_models: string[]` and `chairman_model: string`.

* Initialize defaults from config (`backend/config.py`: `COUNCIL_MODELS` at backend/config.py:12 and `CHAIRMAN_MODEL` at backend/config.py:25) during creation (`backend/storage.py`: add fields in create\_conversation at backend/storage.py:33–38).

* Update backend/storage.py’s conversation retrieval logic.

  * *Constraint:* When reading the JSON file, use .get('council\_models', config.COUNCIL\_MODELS) instead of direct key access. This effectively "migrates" old conversations in-memory without crashing.

1. Model catalog endpoint with caching:

* Add `GET /api/models` returning array of model identifiers from `https://openrouter.ai/api/v1/models`.

* Cache results in-memory with a TTL (e.g., 24h) and fall back to previously cached results on API failure.

* Implement in `backend/openrouter.py` a helper `fetch_available_models()` with httpx and simple cache; wire in `backend/main.py`.

* fetch\_available\_models() should not just return a list of strings. It should return a list of objects: { "id": string, "context\_length": number, "pricing": object }.  Ensure the backend cache stores this metadata, not just the IDs.

1. Conversation config endpoints:

* `GET /api/conversations/{id}` continues returning full conversation including new config fields.

* `PATCH /api/conversations/{id}/config` to update `council_models` and/or `chairman_model` (partial updates allowed).

* Validation:

  * Prevent duplicates in `council_models`.

  * Validation applies to both `council_models`and `chairman_model`

* Persist updates via `backend/storage.save_conversation`.

1. Use per-conversation config in council execution:

* Update `backend/council.py` functions to accept optional overrides:

  * `stage1_collect_responses(user_query, modelsOverride?: string[])`

  * `stage2_collect_rankings(user_query, stage1_results, modelsOverride?: string[])`

  * `stage3_synthesize_final(user_query, stage1_results, stage2_results, chairmanOverride?: string)`

  * Default to `COUNCIL_MODELS` and `CHAIRMAN_MODEL` when overrides are not provided.

* In `backend/main.py` calls (`/message`, `/message/stream`, reruns), load the conversation and pass `conversation.council_models` and `conversation.chairman_model` as overrides.

## Frontend Changes

1. API client (`frontend/src/api.js`):

* Add `getModels()` calling `/api/models`, with error handling.

* Add `updateConversationConfig(conversationId, payload)` calling `PATCH /api/conversations/{id}/config`.

1. UI component:

* Create `frontend/src/components/ConversationConfigPanel.jsx` and CSS.

* Collapsible by default with a clear toggle; remember collapsed state per conversation in `localStorage` (`key: configPanel:<conversationId>`).

* Sections:

  * Council Models:

    * List current models with remove buttons.

    * Auto-complete input to add models from catalog; prevent duplicates; immediate visual feedback (success/error), disabled while saving.

    * **Performance limit:** "In the Auto-complete logic, limit the rendered dropdown list to the top 5–10 matches based on the search query. Do not render the full 100+ model list to the DOM to avoid input lag."

    * **Context Visibility:** "In the dropdown item, display the context\_length (e.g., '128k') next to the model name to help users avoid context limits."

    * **Race Condition Handling:** "Expose a isSavingConfig state. Pass this up to ChatInterface. Disable the main Chat Input (Send button) while isSavingConfig is true to prevent sending a message before the new configuration is persisted."

  * Chairman Model:

    * Auto-complete single-select; validate exists in catalog; immediate save and feedback.

* Loading states for model catalog fetch; error banner if unavailable; allow retry.

* Responsive layout using existing CSS variables and simple flex/grid; ensure it fits under toolbar in `ChatInterface`.

* **Auto-Complete Implementation Spec:**

  1. **Input:** Standard \<input type="text"> that filters a local state array.
  2. **Focus Logic:** Show dropdown on focus; hide on blur (use a short setTimeout on blur to allow clicking an item).
  3. **Filtering:** models.filter(m => m.id.includes(query)).slice(0, 50) — **Crucial:** The .slice(0, 50) ensures the DOM remains light.
  4. **Selection:** Clicking an item replaces the text input with the selected Model ID and triggers the "Save" flow.

1. Integration (`frontend/src/components/ChatInterface.jsx`):

* Render `ConversationConfigPanel` below toolbar and above messages when a conversation is loaded.

* Pass `conversation.id`, `conversation.council_models`, `conversation.chairman_model`, and callbacks to refresh conversation after successful saves.

* Maintain configuration state when collapsing/expanding; do not reset inputs on toggle.

## Persistence & Default Behavior

* Panel collapsed by default; use `localStorage` to maintain collapsed state per conversation.

* Configuration persists server-side within conversation JSON; automatically loaded via `getConversation`.

* Changes take effect immediately because backend reads per-conversation config during council runs; no page refresh required.

## Auto-Complete & Caching Strategy

* Backend caches model list for 24h and serves from cache on failures.

* Frontend additionally caches the list in `localStorage` with timestamp for 1h to reduce network calls; refreshes on expiry or manual reload.

## Error Handling & Feedback

* Show inline success and error messages on config saves.

* Disable inputs while saving; show small spinner next to actions.

* Handle `/api/models` failures by surfacing a non-blocking warning and allow manual entry with validation upon save.

## File-Level Plan

* backend/storage.py: add `council_models` and `chairman_model` default fields in `create_conversation`; ensure read/write unaffected. Update read logic to .get() defaults (Handle Old Convos).

* backend/openrouter.py: add `fetch_available_models()` with caching. Fetch and store context\_length metadata.

* backend/main.py: add `GET /api/models`; add `PATCH /api/conversations/{id}/config`; update message and stream endpoints to pass overrides to council functions.

* backend/council.py: add optional override params; default to config constants.

* frontend/src/api.js: add `getModels`, `updateConversationConfig`.

* frontend/src/components/ConversationConfigPanel.jsx\` + CSS: implement panel UI and logic. Implement "virtualized" or limited-list auto-complete; show context badges; handle "isSaving" state.

* frontend/src/components/ChatInterface.jsx: import and render panel; wire props and refresh behavior. Disable input when ConfigPanel is saving (Race Condition).

  <br />

If this plan looks good, I’ll implement the endpoints, UI component, wiring, and validations accordingly.
