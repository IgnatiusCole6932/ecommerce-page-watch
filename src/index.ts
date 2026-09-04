import { inspectPage, type WatchInput } from "./change_monitor.ts";
import { watchRequest } from "./request_schema.ts";

const url = process.env.WATCH_URL;
if (!url) {
  console.error("Set WATCH_URL to an ecommerce product or order-status page.");
  process.exit(1);
}
const request = watchRequest.parse({ url, previousBody: process.env.PREVIOUS_BODY }) as WatchInput;
const result = await inspectPage(request);
console.log(JSON.stringify({ alert: result.changed, message: result.message, digest: result.digest }, null, 2));
