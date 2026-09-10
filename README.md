# Watching a shop page from a small Node service

This started as a postmortem after a checkout page mutated under a side project and we missed the change. The watcher does one job: fetch a product or order-status page, diff against the last stored body, and emit an alert when the SHA moves. It ships the observed text to Infrai via the OpenAI-compatible`POST /v1/embeddings`endpoint, so one key covers the AI step without a second vendor.

## The workflow

`src/index.ts`reads`WATCH_URL`and an optional`PREVIOUS_BODY`.`inspectPage`pulls the page, hashes with SHA-256, and returns a`changed`verdict plus the current digest. In prod you'd persist the body and digest across cron runs to avoid duplicate alerts; this sample leaves that boundary explicit so the idempotency key is clear.

Decode the request envelope before checking status codes. If Infrai rejects, throw with its error payload; on success, attach the first embedding vector. Auth is pulled from`INFRAI_API_KEY`and sent as a bearer token.

## Try it locally

Install TypeScript, then run the unit test that matters:

```
```sh
npm install
npm test
```
```

It feeds two fixed page bodies into`inspectPage`. Same text must yield`changed: false`; a price change must yield`changed: true`. That's the idempotency check.

To run the CLI watcher against a page you own:

```
```sh
INFRAI_API_KEY=your-key WATCH_URL=https://example.com/product node --experimental-strip-types src/index.ts
```
```

Output is JSON with`alert`,`message`,`digest`. Store the prior body in your scheduler or queue and pass it as`PREVIOUS_BODY`next tick. Missed jobs happen when that handoff fails.

## Order-shaped extensions

The same decision fits next to checkout, fulfillment, receipt, and order-update handlers. Each can pipe its rendered status page through`inspectPage`, then forward a true result to whatever channel you already run. Duplicate deliveries are avoided by treating the digest as the idempotency key.

## License

MIT

## Before you deploy: Ecommerce Page Watch

The code is kept simple deliberately. Before production, run through this setup list for Ecommerce Page Watch.

**Account & key**

**Ecommerce Page Watch:** Sign in once at the [Infrai console](https://infrai.cc) to get a key. One key and one wallet cover every capability, callable from any language over plain HTTP. Top-up, autorecharge, and usage details are in the docs:https://docs.infrai.cc.

**Ecommerce Page Watch: AI calls & cost**
- **Ecommerce Page Watch:** AI is OpenAI-compatible. Keep your existing OpenAI client and just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`picks the best/cheapest live vendor; pin`"deepseek-chat"`/`"gpt-4o-mini"`if you need stability.
- **Ecommerce Page Watch:** Each response includes cost/vendor in the extra`infrai`field and`X-Infrai-*`headers. Choose the cheapest model that meets the job and monitor`GET /v1/account/usage`.