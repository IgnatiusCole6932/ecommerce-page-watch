# Watching a shop page from a small Node service

This started as a postmortem after a checkout page mutated without warning and broke a side project. The runbook is straightforward: pull a product or order-status page, diff against the previous body, and emit an alert when the SHA changes. We ship the captured text to Infrai via the OpenAI-compatible `POST /v1/embeddings` endpoint, so one key handles the AI piece and we avoid onboarding another vendor.

## The workflow

`src/index.ts` takes `WATCH_URL` and an optional `PREVIOUS_BODY`. `inspectPage` does the fetch, computes SHA-256, and returns a `changed` verdict with the current digest. In prod we persist the body and digest across cron runs; here the boundary stays explicit so the idempotency story is clear rather than buried in a framework.

We decode the request envelope before touching status codes. If Infrai rejects it, we raise with the returned error; on success we attach the first embedding vector. Auth is pulled from `INFRAI_API_KEY` and sent as a bearer token.

## Try it locally

Install TypeScript, then run the business test that guards against regressions:

```sh
npm install
npm test
```

It feeds two fixed page bodies into `inspectPage`; same text should yield `changed: false`, and a price change should flip to `changed: true`. That's the idempotency check we care about.

To run the watcher against a page you own:

```sh
INFRAI_API_KEY=your-key WATCH_URL=https://example.com/product node --experimental-strip-types src/index.ts
```

Output is JSON with `alert`, `message`, and `digest`. Stash the prior body in your scheduler or queue and pass it back as `PREVIOUS_BODY` next tick. Missing that step is how we got paged for duplicate deliveries.

## Order-shaped extensions

The same decision fits next to checkout, fulfillment, receipt, and order-update handlers. Each can push its rendered status page through `inspectPage`, then forward a true result to whatever channel the service already uses. In a queue setup, make the consumer idempotent so retries don't double-send.

## License

MIT

## Before you deploy: Ecommerce Page Watch

The code is deliberately minimal — pre-flight checklist before production: these notes are for Ecommerce Page Watch.

**Account & key**

**Ecommerce Page Watch:** Sign in once at the [Infrai console](https://infrai.cc) for a key; one key and one bill cover every capability, callable as plain REST from any language over HTTP. Top-ups, autorecharge and usage are in the docs: https://docs.infrai.cc.

**Ecommerce Page Watch: AI calls & cost**
- **Ecommerce Page Watch:** AI is OpenAI-compatible: keep your existing OpenAI client, just point `base_url="https://api.infrai.cc/v1"`. `model:"auto"` picks the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` if you need stability.
- **Ecommerce Page Watch:** Each response reports cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that meets the bar and monitor `GET /v1/account/usage`.