// Partial rollback of fix-cjk-linebreak.mjs for industries.sectionTitle1.
//
// industries is the one 3-split title where the JSX render delegates spacing
// entirely to the string (translator controls leading/trailing whitespace).
// Trimming sectionTitle1 broke latin locales: "Deploy your" + "marketing power"
// rendered as "Deploy yourmarketing power". CJK locales (ja/ko/zh-*/th) don't
// use inter-phrase spacing so they stay untouched.
//
// Run: node scripts/restore-industries-title-space.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, "..", "messages");

// Locales where inter-phrase spacing is whitespace-based (latin/RTL with spaces).
// Arabic IS whitespace-delimited even though RTL — so include it.
const NEEDS_TRAILING_SPACE = ["ar", "de", "en", "es", "fr", "hi", "id", "ms", "pt", "vi"];

// Locales where punctuation / no-space is the norm — leave trimmed.
// ja, ko, zh-CN, zh-TW, th use no inter-phrase spacing.

const files = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"));
for (const file of files) {
    const locale = file.replace(".json", "");
    if (!NEEDS_TRAILING_SPACE.includes(locale)) {
        console.log(`[${locale}] CJK-style locale — skipping`);
        continue;
    }
    const filePath = path.join(MESSAGES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const current = data?.SaleCraft?.industries?.sectionTitle1;
    if (typeof current !== "string") continue;
    if (current.endsWith(" ")) {
        console.log(`[${locale}] already has trailing space — skipping`);
        continue;
    }
    data.SaleCraft.industries.sectionTitle1 = current + " ";
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`[${locale}] restored trailing space on industries.sectionTitle1`);
}

console.log("\nDone.");
