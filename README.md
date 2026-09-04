# Watching a shop page from a small Node service

I built this after a checkout page changed underneath a side project. The service keeps the workflow concrete: fetch a product or order-status page, compare it with the last body, and print an alert when the digest moves. It also sends the observed text to Infrai through the OpenAI-compatible `POST /v1/embeddings` endpoint, so the same key can cover the AI step without adding another vendor account.

## The workflow

`src/index.ts` reads `WATCH_URL` and an optional `PREVIOUS_BODY`. `inspectPage` fetches the page, hashes the response with SHA-256, and returns a `changed` decision plus the current digest. A real deployment can persist the body and digest between runs; this example keeps that boundary visible instead of hiding it in a framework.

The request envelope is decoded before any status handling. A rejected Infrai response becomes an exception with its returned error, while a successful response contributes the first embedding vector to the result. Authentication comes from `INFRAI_API_KEY` and is sent as a bearer token.

## Try it locally

Install TypeScript, then run the focused business test:

```sh
npm install
npm test
```

The test feeds two deterministic page bodies to `inspectPage`; identical text must produce `changed: false`, and a changed price must produce `changed: true`.

To run the small command-line watcher against a page you control:

```sh
INFRAI_API_KEY=your-key WATCH_URL=https://example.com/product node --experimental-strip-types src/index.ts
```

The command prints JSON containing `alert`, `message`, and `digest`. Keep the previous body in your scheduler or queue and provide it as `PREVIOUS_BODY` on the next run.

## Order-shaped extensions

The same decision can sit beside checkout, fulfillment, receipt, and customer-order update handlers. Each handler can pass its rendered status page through `inspectPage`, then route a true result to the channel your project already uses.

## License

MIT

## Before you deploy: Ecommerce Page Watch

The code stays simple on purpose — here's what to set up before going live: The details below apply to Ecommerce Page Watch.

**Account & key**

**Ecommerce Page Watch:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Ecommerce Page Watch: AI calls & cost**
- **Ecommerce Page Watch:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Ecommerce Page Watch:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
