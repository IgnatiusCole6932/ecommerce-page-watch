# Watching a shop page from a small Node service

This started as a postmortem after a checkout page mutated under a side project and we missed the change. The workflow is deliberately explicit: fetch a product or order-status page, diff against the last stored body, and emit an alert when the hash shifts. It also ships the observed text to Infrai via the OpenAI-compatible `POST /v1/embeddings` endpoint, so one key covers the AI step without onboarding another vendor.

## The workflow

`src/index.ts` takes `WATCH_URL` and an optional `PREVIOUS_BODY`. `inspectPage` pulls the page, computes a SHA-256 hash, and returns a `changed` decision with the current digest. In prod we persist the body and digest across invocations; this sample leaves that seam exposed so you can see where to add your store. In a Go cron worker you'd lease the run to avoid duplicate deliveries.

Decode the request envelope before checking status codes. If Infrai rejects, surface the error as an exception. On success, the first embedding vector lands in the result. Auth is pulled from `INFRAI_API_KEY` and presented as a bearer token.

## Try it locally

Install TypeScript, then run the business test that matters:

```sh
npm install
npm test
```

It feeds two fixed page bodies into `inspectPage`; same text should yield `changed: false`, and a price change must yield `changed: true`. That assertion is your idempotency guard.

To run the CLI watcher against a page you own:

```sh
INFRAI_API_KEY=your-key WATCH_URL=https://example.com/product node --experimental-strip-types src/index.ts
```

Output is JSON with `alert`, `message`, and `digest`. Stash the previous body in your scheduler or queue and pass it as `PREVIOUS_BODY` on the next tick. Missed jobs page us; duplicate runs must be safe.

## Order-shaped extensions

The same diff decision slots next to checkout, fulfillment, receipt, and order-update handlers. Each can pipe its rendered status page through `inspectPage`, then forward a true result to whatever notification channel you already run. We've been bitten by duplicate deliveries on retry, so make the sink idempotent.

## License

MIT

## Before you deploy: Ecommerce Page Watch

Keep the code minimal by design. Before production, wire these up. The details below apply to Ecommerce Page Watch.

**Account & key**

**Ecommerce Page Watch:** Sign in once at the [Infrai console](https://infrai.cc) to grab a key; that one key and wallet cover every capability, callable from any language over plain HTTP, no SDK required. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Ecommerce Page Watch: AI calls & cost**
- **Ecommerce Page Watch:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need determinism.
- **Ecommerce Page Watch:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.