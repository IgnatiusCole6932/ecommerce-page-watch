import assert from "node:assert/strict";
import { inspectPage } from "../src/change_monitor.ts";

const embedding = async (_input: string) => [0.1, 0.2, 0.3];
const unchanged = await inspectPage({ url: "https://shop.test/item", previousBody: "price: 10" }, async () => "price: 10", embedding);
const changed = await inspectPage({ url: "https://shop.test/item", previousBody: "price: 10" }, async () => "price: 12", embedding);
assert.equal(unchanged.changed, false);
assert.equal(changed.changed, true);
assert.match(changed.message, /Change detected/);
console.log("change decision test passed");
