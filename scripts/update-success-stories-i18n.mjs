// One-off migration: replace the SuccessStories block (3 fictional brands) with
// the single MingJian Biotech real-customer case across 13 remaining locales.
// Run: node scripts/update-success-stories-i18n.mjs
//
// Source of truth for content semantics: messages/en.json + messages/zh-TW.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, "..", "messages");

const TRANSLATIONS = {
    // Arabic (RTL)
    ar: {
        badge: "نتائج عملاء حقيقية",
        sectionTitle1: "صفحة هبوط باعت ",
        sectionTitle2: "أكثر من 20,000 وحدة",
        sectionSubtitle: "أنشأت شركة MingJian Biotech صفحة هبوط واحدة باستخدام SaleCraft وباعت أكثر من 20,000 علبة من لحم الدجاج في شهر واحد — هذا ليس مفهوماً، بل حدث بالفعل.",
        ctaHint: "قد تكون قصتك هي التالية.",
        cases: {
            mingjian: {
                industry: "الأغذية والتكنولوجيا الحيوية",
                brand: "MingJian Biotech",
                tagline: "علامة تايوانية لحم الدجاج المفروم. بدون فريق تسويق، بدون وكالة — فقط صفحة هبوط واحدة أخذتهم من الصفر إلى أكثر من 20,000 علبة.",
                quote: "قمنا ببناء صفحة مبيعات لحم الدجاج المفروم مع SaleCraft وبعنا أكثر من 20,000 علبة في الشهر الأول. كان العائد على الاستثمار مذهلاً — استرددناه خلال ساعات.",
                author: "السيد لين",
                role: "الرئيس التنفيذي، MingJian Biotech",
                metricUnits: "علبة مباعة",
                metricDays: "يوماً للوصول",
                metricPages: "صفحة هبوط",
                highlight: "أكثر من 20,000 علبة في شهر",
            },
        },
    },
    // German
    de: {
        badge: "Echte Kundenerfolge",
        sectionTitle1: "Die Landing Page, die ",
        sectionTitle2: "20,000+ Einheiten verkauft hat",
        sectionSubtitle: "MingJian Biotech baute mit SaleCraft eine einzige Landing Page und verkaufte in einem Monat über 20.000 Gläser Hühnerfleisch-Floss — kein Konzept, das ist wirklich passiert.",
        ctaHint: "Deine Story könnte die nächste sein.",
        cases: {
            mingjian: {
                industry: "Lebensmittel & Biotech",
                brand: "MingJian Biotech",
                tagline: "Eine taiwanesische Hühnerfleisch-Floss-Marke. Kein Marketing-Team, keine Agentur — nur eine Landing Page, die sie von null auf 20.000+ Gläser brachte.",
                quote: "Wir haben unsere Chicken-Floss-Verkaufsseite mit SaleCraft gebaut und im ersten Monat über 20.000 Gläser verkauft. Der ROI war atemberaubend — innerhalb von Stunden amortisiert.",
                author: "Herr Lin",
                role: "CEO, MingJian Biotech",
                metricUnits: "verkaufte Gläser",
                metricDays: "Tage zum Ziel",
                metricPages: "Landing Page",
                highlight: "20.000+ Gläser in einem Monat",
            },
        },
    },
    // Spanish
    es: {
        badge: "Resultados Reales de Clientes",
        sectionTitle1: "La Landing Page que vendió ",
        sectionTitle2: "más de 20,000 unidades",
        sectionSubtitle: "MingJian Biotech construyó una Landing Page con SaleCraft y vendió más de 20,000 frascos de hilo de pollo en un solo mes — no es un concepto, realmente ocurrió.",
        ctaHint: "Tu historia podría ser la siguiente.",
        cases: {
            mingjian: {
                industry: "Alimentos y Biotecnología",
                brand: "MingJian Biotech",
                tagline: "Una marca taiwanesa de hilo de pollo. Sin equipo de marketing, sin agencia — solo una Landing Page que los llevó de cero a más de 20,000 frascos.",
                quote: "Construimos nuestra página de ventas de hilo de pollo con SaleCraft y vendimos más de 20,000 frascos en el primer mes. El ROI fue asombroso — lo recuperamos en horas.",
                author: "Sr. Lin",
                role: "CEO, MingJian Biotech",
                metricUnits: "frascos vendidos",
                metricDays: "días para llegar",
                metricPages: "Landing Page",
                highlight: "20,000+ frascos en un mes",
            },
        },
    },
    // French
    fr: {
        badge: "Résultats Clients Réels",
        sectionTitle1: "La Landing Page qui a vendu ",
        sectionTitle2: "20 000+ unités",
        sectionSubtitle: "MingJian Biotech a créé une Landing Page avec SaleCraft et a vendu plus de 20 000 pots de floss de poulet en un seul mois — ce n'est pas un concept, c'est réellement arrivé.",
        ctaHint: "Votre histoire pourrait être la prochaine.",
        cases: {
            mingjian: {
                industry: "Alimentation & Biotech",
                brand: "MingJian Biotech",
                tagline: "Une marque taïwanaise de floss de poulet. Pas d'équipe marketing, pas d'agence — juste une Landing Page qui les a menés de zéro à plus de 20 000 pots.",
                quote: "Nous avons construit notre page de vente de floss de poulet avec SaleCraft et vendu plus de 20 000 pots le premier mois. Le ROI était stupéfiant — rentabilisé en quelques heures.",
                author: "M. Lin",
                role: "PDG, MingJian Biotech",
                metricUnits: "pots vendus",
                metricDays: "jours atteints",
                metricPages: "Landing Page",
                highlight: "20 000+ pots en un mois",
            },
        },
    },
    // Hindi
    hi: {
        badge: "वास्तविक ग्राहक परिणाम",
        sectionTitle1: "लैंडिंग पेज जिसने ",
        sectionTitle2: "20,000+ यूनिट बेचे",
        sectionSubtitle: "MingJian Biotech ने SaleCraft के साथ एक लैंडिंग पेज बनाया और एक ही महीने में 20,000 से अधिक चिकन फ्लॉस जार बेचे — यह कोई अवधारणा नहीं है, यह वास्तव में हुआ।",
        ctaHint: "आपकी कहानी अगली हो सकती है।",
        cases: {
            mingjian: {
                industry: "खाद्य और बायोटेक",
                brand: "MingJian Biotech",
                tagline: "एक ताइवानी चिकन फ्लॉस ब्रांड। कोई मार्केटिंग टीम नहीं, कोई एजेंसी नहीं — बस एक लैंडिंग पेज जिसने उन्हें शून्य से 20,000+ जार तक पहुंचाया।",
                quote: "हमने SaleCraft के साथ अपना चिकन फ्लॉस सेल्स पेज बनाया और पहले महीने में 20,000 से अधिक जार बेचे। ROI चौंकाने वाला था — घंटों में भुगतान हो गया।",
                author: "श्री लिन",
                role: "सीईओ, MingJian Biotech",
                metricUnits: "बेचे गए जार",
                metricDays: "दिनों में पूरा",
                metricPages: "लैंडिंग पेज",
                highlight: "एक महीने में 20,000+ जार",
            },
        },
    },
    // Indonesian
    id: {
        badge: "Hasil Pelanggan Nyata",
        sectionTitle1: "Landing Page yang menjual ",
        sectionTitle2: "20.000+ unit",
        sectionSubtitle: "MingJian Biotech membuat satu Landing Page dengan SaleCraft dan menjual lebih dari 20.000 toples abon ayam dalam satu bulan — bukan konsep, ini benar-benar terjadi.",
        ctaHint: "Cerita Anda bisa jadi berikutnya.",
        cases: {
            mingjian: {
                industry: "Pangan & Bioteknologi",
                brand: "MingJian Biotech",
                tagline: "Merek abon ayam asal Taiwan. Tanpa tim marketing, tanpa agensi — hanya satu Landing Page yang membawa mereka dari nol ke 20.000+ toples.",
                quote: "Kami membangun halaman penjualan abon ayam dengan SaleCraft dan menjual lebih dari 20.000 toples di bulan pertama. ROI-nya luar biasa — balik modal dalam hitungan jam.",
                author: "Mr. Lin",
                role: "CEO, MingJian Biotech",
                metricUnits: "toples terjual",
                metricDays: "hari untuk mencapai",
                metricPages: "Landing Page",
                highlight: "20.000+ toples dalam sebulan",
            },
        },
    },
    // Japanese
    ja: {
        badge: "実際のお客様の成果",
        sectionTitle1: "20,000個以上を売った",
        sectionTitle2: "ランディングページ",
        sectionSubtitle: "MingJian Biotech は SaleCraft で1枚のランディングページを作成し、1か月で鶏肉そぼろを 20,000 瓶以上販売しました — これは概念ではなく、実際に起きたことです。",
        ctaHint: "次はあなたの物語かもしれません。",
        cases: {
            mingjian: {
                industry: "食品・バイオテック",
                brand: "MingJian Biotech",
                tagline: "台湾発の鶏肉そぼろブランド。マーケティングチームなし、代理店なし — ただ1枚のランディングページで、ゼロから 20,000 瓶以上へ。",
                quote: "SaleCraft で鶏肉そぼろの販売ページを作って、初月に 20,000 瓶以上売れました。ROI は驚異的で、数時間で元が取れました。",
                author: "Lin さん",
                role: "MingJian Biotech CEO",
                metricUnits: "瓶販売",
                metricDays: "日で達成",
                metricPages: "ランディングページ",
                highlight: "1か月で 20,000 瓶以上",
            },
        },
    },
    // Korean
    ko: {
        badge: "실제 고객 성과",
        sectionTitle1: "20,000개 이상 팔린",
        sectionTitle2: "랜딩 페이지",
        sectionSubtitle: "MingJian Biotech는 SaleCraft로 랜딩 페이지 하나를 만들어 한 달 만에 닭고기 볶음 플로스 20,000병 이상을 판매했습니다 — 개념이 아닌 실제로 일어난 일입니다.",
        ctaHint: "다음 이야기는 당신일 수 있습니다.",
        cases: {
            mingjian: {
                industry: "식품·바이오텍",
                brand: "MingJian Biotech",
                tagline: "대만 닭고기 플로스 브랜드. 마케팅 팀도, 에이전시도 없이 — 단 하나의 랜딩 페이지로 0에서 20,000병 이상을 달성했습니다.",
                quote: "SaleCraft로 닭고기 플로스 판매 페이지를 만들었고 첫 달에 20,000병 이상 판매했습니다. ROI가 놀라웠어요 — 몇 시간 만에 본전을 뽑았습니다.",
                author: "Lin 씨",
                role: "MingJian Biotech CEO",
                metricUnits: "병 판매",
                metricDays: "일 만에 달성",
                metricPages: "랜딩 페이지",
                highlight: "한 달에 20,000병 이상",
            },
        },
    },
    // Malay
    ms: {
        badge: "Hasil Pelanggan Sebenar",
        sectionTitle1: "Landing Page yang menjual ",
        sectionTitle2: "20,000+ unit",
        sectionSubtitle: "MingJian Biotech membina satu Landing Page dengan SaleCraft dan menjual lebih 20,000 balang daging ayam koyak dalam sebulan — bukan konsep, ini benar-benar berlaku.",
        ctaHint: "Kisah anda mungkin seterusnya.",
        cases: {
            mingjian: {
                industry: "Makanan & Bioteknologi",
                brand: "MingJian Biotech",
                tagline: "Jenama daging ayam koyak Taiwan. Tiada pasukan pemasaran, tiada agensi — hanya satu Landing Page yang membawa mereka dari kosong ke 20,000+ balang.",
                quote: "Kami bina halaman jualan daging ayam koyak dengan SaleCraft dan menjual lebih 20,000 balang pada bulan pertama. ROI sangat menakjubkan — pulang modal dalam beberapa jam.",
                author: "En. Lin",
                role: "CEO, MingJian Biotech",
                metricUnits: "balang dijual",
                metricDays: "hari untuk capai",
                metricPages: "Landing Page",
                highlight: "20,000+ balang sebulan",
            },
        },
    },
    // Portuguese
    pt: {
        badge: "Resultados Reais de Clientes",
        sectionTitle1: "A Landing Page que vendeu ",
        sectionTitle2: "mais de 20,000 unidades",
        sectionSubtitle: "A MingJian Biotech criou uma Landing Page com o SaleCraft e vendeu mais de 20.000 potes de frango desfiado em um único mês — não é um conceito, aconteceu de verdade.",
        ctaHint: "Sua história pode ser a próxima.",
        cases: {
            mingjian: {
                industry: "Alimentos e Biotecnologia",
                brand: "MingJian Biotech",
                tagline: "Uma marca taiwanesa de frango desfiado. Sem equipe de marketing, sem agência — apenas uma Landing Page que os levou de zero a mais de 20.000 potes.",
                quote: "Criamos nossa página de vendas de frango desfiado com o SaleCraft e vendemos mais de 20.000 potes no primeiro mês. O ROI foi impressionante — recuperamos em horas.",
                author: "Sr. Lin",
                role: "CEO, MingJian Biotech",
                metricUnits: "potes vendidos",
                metricDays: "dias para atingir",
                metricPages: "Landing Page",
                highlight: "20.000+ potes em um mês",
            },
        },
    },
    // Thai
    th: {
        badge: "ผลลัพธ์ลูกค้าจริง",
        sectionTitle1: "แลนดิ้งเพจที่ขายได้ ",
        sectionTitle2: "20,000+ หน่วย",
        sectionSubtitle: "MingJian Biotech สร้างแลนดิ้งเพจหนึ่งหน้าด้วย SaleCraft และขายไก่หยองได้มากกว่า 20,000 กระปุกในเดือนเดียว — ไม่ใช่แนวคิด แต่เกิดขึ้นจริง",
        ctaHint: "เรื่องราวของคุณอาจเป็นเรื่องถัดไป",
        cases: {
            mingjian: {
                industry: "อาหารและไบโอเทค",
                brand: "MingJian Biotech",
                tagline: "แบรนด์ไก่หยองไต้หวัน ไม่มีทีมการตลาด ไม่มีเอเจนซี — มีเพียงแลนดิ้งเพจเดียวที่พาพวกเขาจากศูนย์สู่ 20,000+ กระปุก",
                quote: "เราสร้างหน้าขายไก่หยองด้วย SaleCraft และขายได้มากกว่า 20,000 กระปุกในเดือนแรก ROI น่าทึ่งมาก — คืนทุนภายในไม่กี่ชั่วโมง",
                author: "คุณ Lin",
                role: "CEO, MingJian Biotech",
                metricUnits: "กระปุกที่ขาย",
                metricDays: "วันในการบรรลุ",
                metricPages: "แลนดิ้งเพจ",
                highlight: "20,000+ กระปุกในหนึ่งเดือน",
            },
        },
    },
    // Vietnamese
    vi: {
        badge: "Kết Quả Khách Hàng Thực Tế",
        sectionTitle1: "Landing Page bán được ",
        sectionTitle2: "hơn 20,000 đơn vị",
        sectionSubtitle: "MingJian Biotech xây dựng một Landing Page với SaleCraft và bán hơn 20.000 lọ ruốc gà trong một tháng — không phải khái niệm, đây là điều thực sự đã xảy ra.",
        ctaHint: "Câu chuyện của bạn có thể là tiếp theo.",
        cases: {
            mingjian: {
                industry: "Thực phẩm & Công nghệ sinh học",
                brand: "MingJian Biotech",
                tagline: "Thương hiệu ruốc gà Đài Loan. Không đội marketing, không agency — chỉ một Landing Page đưa họ từ 0 đến hơn 20.000 lọ.",
                quote: "Chúng tôi xây dựng trang bán hàng ruốc gà với SaleCraft và bán hơn 20.000 lọ trong tháng đầu tiên. ROI thật ấn tượng — hoàn vốn trong vài giờ.",
                author: "Ông Lin",
                role: "CEO, MingJian Biotech",
                metricUnits: "lọ bán ra",
                metricDays: "ngày đạt được",
                metricPages: "Landing Page",
                highlight: "20.000+ lọ trong một tháng",
            },
        },
    },
    // Simplified Chinese
    "zh-CN": {
        badge: "真实客户成果",
        sectionTitle1: "卖出 20,000 罐的",
        sectionTitle2: "Landing Page",
        sectionSubtitle: "明健生技用 SaleCraft 做了一页 Landing Page，单月卖出超过 20,000 罐鸡肉松——不是概念，是真的发生过的事。",
        ctaHint: "下一个故事可能就是你。",
        cases: {
            mingjian: {
                industry: "食品生技",
                brand: "明健生技",
                tagline: "台湾在地鸡肉松品牌。没有营销团队、没有代理商，只用一页 Landing Page 完成从 0 到 20,000 罐的突破。",
                quote: "我们用 SaleCraft 做了鸡肉松的销售页面，第一个月就卖出超过 20,000 罐。投资报酬率超惊人——几小时内就回本了。",
                author: "林先生",
                role: "明健生技 执行长",
                metricUnits: "罐售出",
                metricDays: "天达成",
                metricPages: "页 Landing Page",
                highlight: "单月卖出 20,000+ 罐",
            },
        },
    },
};

for (const [locale, successStories] of Object.entries(TRANSLATIONS)) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    if (!data.SaleCraft) {
        console.error(`[${locale}] missing SaleCraft block, skipping`);
        continue;
    }
    data.SaleCraft.successStories = successStories;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`[${locale}] updated ✓`);
}

console.log(`\nDone — ${Object.keys(TRANSLATIONS).length} locales updated.`);
