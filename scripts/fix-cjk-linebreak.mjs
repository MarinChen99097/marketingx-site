// Strip trailing whitespace from CJK-sensitive headline fields so word-break:keep-all
// actually keeps the phrase intact. A trailing space becomes a legal break point in
// most browsers and cancels the protection (manifested as "顧問，擅" / "長" wrap).
//
// Only touches fields rendered inside the Hero h1 and other large headline spans.
// Run: node scripts/fix-cjk-linebreak.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, "..", "messages");

// Dotted paths (under SaleCraft.*) of fields that render in headline-sized spans
// and may cause mid-phrase CJK breaks when their values end in whitespace.
const FIELDS_TO_TRIM = [
    "hero.title1",
    "hero.title2",
    "pluginInstall.title1",
    "pluginInstall.title2",
    "capabilities.sectionTitle1",
    "capabilities.sectionTitle2",
    "industries.sectionTitle1",
    "industries.sectionTitle2",
    "industries.sectionTitle3",
    "successStories.sectionTitle1",
    "successStories.sectionTitle2",
    "finalCta.title1",
    "finalCta.title2",
    "pricing.title1",
    "pricing.title2",
];

function getNested(obj, dottedPath) {
    return dottedPath.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function setNested(obj, dottedPath, value) {
    const keys = dottedPath.split(".");
    const last = keys.pop();
    const parent = keys.reduce((acc, k) => (acc[k] ??= {}), obj);
    parent[last] = value;
}

const files = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"));
let totalTrims = 0;

for (const file of files) {
    const filePath = path.join(MESSAGES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const root = data.SaleCraft;
    if (!root) continue;

    let trimsInFile = 0;
    for (const field of FIELDS_TO_TRIM) {
        const current = getNested(root, field);
        if (typeof current !== "string") continue;
        const trimmed = current.replace(/\s+$/u, "");
        if (trimmed !== current) {
            setNested(root, field, trimmed);
            trimsInFile++;
            totalTrims++;
        }
    }

    if (trimsInFile > 0) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
        console.log(`[${file}] trimmed ${trimsInFile} field(s)`);
    } else {
        console.log(`[${file}] clean`);
    }
}

console.log(`\nDone — ${totalTrims} trailing whitespace(s) removed across ${files.length} locales.`);
