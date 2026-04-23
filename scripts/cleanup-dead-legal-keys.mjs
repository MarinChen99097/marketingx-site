// Remove Legal.loading and Legal.lastUpdated across all locales — unused after
// terms/privacy moved from client-fetch to Server Component rendering.
// Run: node scripts/cleanup-dead-legal-keys.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, "..", "messages");
const DEAD_KEYS = ["loading", "lastUpdated"];

for (const file of fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"))) {
    const filePath = path.join(MESSAGES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const legal = data?.Legal;
    if (!legal) continue;
    let removed = 0;
    for (const key of DEAD_KEYS) {
        if (key in legal) {
            delete legal[key];
            removed++;
        }
    }
    if (removed > 0) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
        console.log(`[${file}] removed ${removed} dead Legal keys`);
    }
}
