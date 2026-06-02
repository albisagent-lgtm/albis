# Feed AI Review Scale Plan

## Current local implementation

User flow:
1. User chooses `AI review my links` on `/create`.
2. `/api/feed/cards` stores a card immediately in `albis_live_signals`.
3. Metadata marks it as:
   - `ai_review_requested: true`
   - `ai_review_status: queued`
   - `source_urls: [...]`
   - `creation_mode: ai-review-auto`
4. `/api/cron/feed-ai-review` processes queued rows in batches, generates the AI review, and updates the same card.

This is automatic background processing, not blocking inline generation.

## Production requirements

### AI provider
Cloudflare production must have at least one model provider configured:
- Cloudflare Workers AI binding or REST credentials, OR
- `OPENAI_API_KEY` / `ALBIS_OPENAI_API_KEY`, OR
- `OPENROUTER_API_KEY` / `ALBIS_OPENROUTER_API_KEY`

`ALBIS_EDITORIAL_MODEL_PROVIDER=openclaw-system` works locally but may not work inside Cloudflare Workers without the CLI path, so the editorial client now falls back to configured API providers.

### Processor scheduling
Small/beta scale:
- call `POST /api/cron/feed-ai-review` every 1-5 minutes
- auth header: `Authorization: Bearer $SCAN_INGEST_KEY`
- body: `{ "limit": 5 }` or higher

Larger scale:
- replace cron polling with Cloudflare Queues
- each AI-review submission enqueues one message
- queue consumer processes concurrently with controlled max concurrency/retries/dead-letter queue

## Rate limits
Current configurable vars:
- `ALBIS_FEED_CARD_RATE_LIMIT_MAX=60`
- `ALBIS_FEED_CARD_RATE_WINDOW_MINUTES=15`
- `ALBIS_FEED_AI_REVIEW_BATCH_LIMIT=5`

Do not remove rate limits entirely. For scale, use per-user/IP/global limits + queue backpressure.

## 1,000 requests/minute target
Do not run AI inline. Required architecture:
- immediate write to Supabase
- Cloudflare Queue message per AI review
- consumer concurrency tuned to AI provider limits
- dead-letter queue for failed jobs
- retries with exponential backoff
- dashboard/metadata states: queued, processing, generated, failed

The current queued route is a stepping stone and can run automatically via cron, but true 1,000/min reliability should use Cloudflare Queues.
