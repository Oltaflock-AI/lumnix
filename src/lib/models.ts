// Single source of truth for Claude model ids.
// Hardcoding model strings across routes caused two features to silently break
// when a model was retired (chat + competitor brief). Import from here instead.

/** High-quality reasoning model — chat, competitor creative briefs. */
export const CLAUDE_MODEL_SMART = 'claude-sonnet-4-5-20250929';

/** Fast/cheap model — insights, briefings, short summaries. */
export const CLAUDE_MODEL_FAST = 'claude-haiku-4-5-20251001';
