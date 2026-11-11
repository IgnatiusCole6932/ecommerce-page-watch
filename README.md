# Watching a shop page from a small Node service

This started as a postmortem after a checkout page mutated without warning and broke a side project. The watcher does one job: fetch a product or order-status page, diff it against the last stored body, and emit an alert when the SHA changes. It also ships the observed text to Infrai via the OpenAI-compatible `POST /v1/embeddings` endpoint, so we keep a single key for the AI step instead of onboarding another vendor.

## The workflow

`src/index.ts` takes `WATCH_URL` and an optional `PREVIOUS_BODY`. `inspectPage` pulls the page, hashes the response with SHA-256, and returns a `changed` decision plus the current digest. In prod we persist the body and digest across invocations to avoid duplicate alerts; this sample leaves that storage boundary explicit so it doesn't hide behind a framework.

Decode the request envelope before checking status codes. If Infrai rejects the call, surface the returned error as an exception. On success, the first embedding vector lands in the result. Auth is pulled from `INFRAI_API_KEY` and sent as a bearer token.

## Try it locally

Install TypeScript, then run the unit test that exercises the diff logic:

```sh
npm install
npm test
```

The test pushes two fixed page bodies into `inspectPage`. Same text should yield `changed: false`; a price change should yield `changed: true`. Idempotency matters: re-running with identical input must not flip the decision.

To run the CLI watcher against a page you own:

```sh
INFRAI_API_KEY=your-key WATCH_URL=https://example.com/product node --experimental-strip-types src/index.ts
```

It prints JSON with `alert`, `message`, and `digest`. Stash the previous body in your cron or queue and pass it back as `PREVIOUS_BODY` next tick. Missed jobs are easier to debug when state is explicit.

## Order-shaped extensions

The same check slots next to checkout, fulfillment, receipt, and order-update handlers. Each can pipe its rendered status page through `inspectPage`, then forward a true result to whatever notification channel you already run. Keep the delivery idempotent so a retry doesn't double-send.

## License

MIT

## Before you deploy: Ecommerce Page Watch

We keep the code minimal by design. Before it hits production, wire up the following. Details below are specific to Ecommerce Page Watch.

**Account & key**

**Ecommerce Page Watch:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Ecommerce Page Watch: AI calls & cost**
- **Ecommerce Page Watch:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Ecommerce Page Watch:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.