// Propagate the Auth + Legal i18n blocks from zh-TW/en to the remaining locales.
// zh-CN gets the zh-TW block (same meaning, simplified-only tweaks not needed for
// 10-key legal strings). Every other locale gets the en block as a bootstrap
// translation — to be polished later with proper native translators.
//
// Run: node scripts/propagate-auth-i18n.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, "..", "messages");

const enData = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, "en.json"), "utf8"));
const zhTWData = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, "zh-TW.json"), "utf8"));

const EN_AUTH = enData.Auth;
const EN_LEGAL = enData.Legal;
const ZH_AUTH = zhTWData.Auth;
const ZH_LEGAL = zhTWData.Legal;

// zh-CN: nearly identical to zh-TW; swap a few characters for simplified.
const zhCNTransforms = {
    "開始你的 AI 行銷之旅": "开始你的 AI 营销之旅",
    "30 秒內登入，用 Google 帳號即可開始使用": "30 秒内登录，用 Google 帐号即可开始使用",
    "返回首頁": "返回首页",
    "我已閱讀並同意": "我已阅读并同意",
    "服務條款": "服务条款",
    "隱私權政策": "隐私政策",
    "勾選後才能使用 Google 登入": "勾选后才能使用 Google 登录",
    "繼續以 Google 登入": "继续以 Google 登录",
    "驗證中，請稍候…": "验证中，请稍候…",
    "登入失敗，請重試。": "登录失败，请重试。",
    "未收到 Google 憑證，請重試。": "未收到 Google 凭证，请重试。",
    "驗證伺服器暫時無法回應，請稍後再試。": "验证服务器暂时无法响应，请稍后再试。",
    "請先勾選同意服務條款與隱私權政策。": "请先勾选同意服务条款与隐私政策。",
    "首次登入將自動建立你的 SaleCraft 帳號": "首次登录将自动创建你的 SaleCraft 帐号",
    "第二次以後，這就是你的登入入口": "第二次以后，这就是你的登录入口",
    "偵測到你已登入，準備前往下一步…": "检测到你已登录，准备前往下一步…",
    "遇到問題？請聯絡": "遇到问题？请联络",
    "最後更新日期": "最后更新日期",
    "載入中…": "加载中…",
    "法律條款載入失敗，請稍後重試或聯絡 zereo@connact.ai。":
        "法律条款加载失败，请稍后重试或联络 zereo@connact.ai。",
};

function zhCNify(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        out[k] = typeof v === "string" && zhCNTransforms[v] ? zhCNTransforms[v] : v;
    }
    return out;
}

const LOCALES = fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));

for (const locale of LOCALES) {
    if (locale === "zh-TW" || locale === "en") continue;
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (locale === "zh-CN") {
        data.Auth = zhCNify(ZH_AUTH);
        data.Legal = zhCNify(ZH_LEGAL);
    } else {
        // All other locales: use English as the bootstrap translation.
        data.Auth = { ...EN_AUTH };
        data.Legal = { ...EN_LEGAL };
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`[${locale}] Auth + Legal blocks added ✓`);
}

console.log(`\nDone — propagated to ${LOCALES.length - 2} locales.`);
