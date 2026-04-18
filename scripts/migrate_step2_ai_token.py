"""
Migrate messages/*.json: shift step2/3/4 → step3/4/5 and inject new step2
(AI Login Token).

Idempotent: skips files that already have step5 populated.

Cause: commit dc8d714 (i18n expansion) added 15 locale files but kept the
old step numbering (step2=Meta, step3=Google, step4=Topup). Meanwhile the
page.tsx uses step2=AI Token, step3=Meta, step4=Google, step5=Topup. That
leaves every non-empty locale rendering the wrong titles and throwing
MISSING_MESSAGE for step2.generatePrompt, step5.*, etc.
"""
import json
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).parent.parent
MESSAGES = ROOT / "messages"

# NEW step2 content — one block per locale. Keep keys identical across
# locales so page.tsx t() calls resolve everywhere.
STEP2_AI_TOKEN = {
    "zh-TW": {
        "title": "複製 AI 登入 Token",
        "desc": "生成後把下面這串 token 貼給你的 AI 助手（ChatGPT、Claude、Gemini 等），它就能幫你登入 SaleCraft，不需要給密碼。Token 12 小時後自動過期。",
        "generatePrompt": "按下按鈕生成一組專屬於你的 AI Token。",
        "generateBtn": "生成 AI Token",
        "loading": "正在生成你的 Token...",
        "notReady": "（尚未生成）",
        "copyBtn": "複製 Token",
        "copiedBtn": "已複製！",
        "copyFailed": "自動複製失敗，請點擊下方輸入框選取 token 後按 Cmd/Ctrl+C",
        "tapToSelect": "點擊上方選取 Token",
        "regenerate": "重新生成",
        "expiresAt": "於 {time} 過期",
        "expiresSoon": "⚠️ Token 即將過期，請重新生成",
        "singleLiveWarning": "重新生成會讓所有已經貼過 token 的 AI 立刻失效，只在懷疑 token 外洩時才這麼做。",
        "featureUnavailable": "此功能正在維護中，請先使用 Email 密碼登入",
        "createFailed": "無法生成 Token，請稍後再試或重新整理頁面",
    },
    "en": {
        "title": "Copy Your AI Login Token",
        "desc": "Paste this token to your AI assistant (ChatGPT, Claude, Gemini, etc.) and it can log you into SaleCraft without your email or password. The token expires in 12 hours.",
        "generatePrompt": "Press the button to generate a personal AI Token.",
        "generateBtn": "Generate AI Token",
        "loading": "Generating your token...",
        "notReady": "(not generated yet)",
        "copyBtn": "Copy Token",
        "copiedBtn": "Copied!",
        "copyFailed": "Automatic copy failed. Tap the input below to select the token, then press Cmd/Ctrl+C.",
        "tapToSelect": "Tap to Select Token",
        "regenerate": "Regenerate",
        "expiresAt": "Expires at {time}",
        "expiresSoon": "⚠️ Token expires soon — please regenerate",
        "singleLiveWarning": "Regenerating will instantly invalidate the token anywhere else you pasted it. Only regenerate if you suspect the token leaked.",
        "featureUnavailable": "This feature is under maintenance. Please log in with email and password for now.",
        "createFailed": "Couldn't generate a token. Please try again or refresh the page.",
    },
    "zh-CN": {
        "title": "复制 AI 登录 Token",
        "desc": "生成后把下面这串 token 贴给你的 AI 助手（ChatGPT、Claude、Gemini 等），它就能帮你登录 SaleCraft，不需要给密码。Token 12 小时后自动过期。",
        "generatePrompt": "按下按钮生成一组专属于你的 AI Token。",
        "generateBtn": "生成 AI Token",
        "loading": "正在生成你的 Token...",
        "notReady": "（尚未生成）",
        "copyBtn": "复制 Token",
        "copiedBtn": "已复制！",
        "copyFailed": "自动复制失败，请点击下方输入框选取 token 后按 Cmd/Ctrl+C",
        "tapToSelect": "点击上方选取 Token",
        "regenerate": "重新生成",
        "expiresAt": "于 {time} 过期",
        "expiresSoon": "⚠️ Token 即将过期，请重新生成",
        "singleLiveWarning": "重新生成会让所有已经贴过 token 的 AI 立刻失效，只在怀疑 token 泄漏时才这么做。",
        "featureUnavailable": "此功能正在维护中，请先使用 Email 密码登录",
        "createFailed": "无法生成 Token，请稍后再试或刷新页面",
    },
    "ja": {
        "title": "AI ログイントークンをコピー",
        "desc": "生成後、このトークンを AI アシスタント（ChatGPT、Claude、Gemini など）に貼り付けると、パスワードを渡さずに SaleCraft にログインできます。トークンは 12 時間後に自動的に期限切れになります。",
        "generatePrompt": "ボタンを押して、あなた専用の AI トークンを生成します。",
        "generateBtn": "AI トークンを生成",
        "loading": "トークンを生成中...",
        "notReady": "（未生成）",
        "copyBtn": "トークンをコピー",
        "copiedBtn": "コピーしました！",
        "copyFailed": "自動コピーに失敗しました。下の入力欄をタップしてトークンを選択し、Cmd/Ctrl+C を押してください。",
        "tapToSelect": "タップしてトークンを選択",
        "regenerate": "再生成",
        "expiresAt": "{time} に期限切れ",
        "expiresSoon": "⚠️ トークンがまもなく期限切れ — 再生成してください",
        "singleLiveWarning": "再生成すると、他の場所に貼り付けたトークンが即座に無効になります。トークン漏洩が疑われる場合のみ再生成してください。",
        "featureUnavailable": "この機能はメンテナンス中です。メールとパスワードでログインしてください。",
        "createFailed": "トークンを生成できませんでした。後でもう一度試すか、ページを更新してください。",
    },
    "ko": {
        "title": "AI 로그인 토큰 복사",
        "desc": "생성 후 이 토큰을 AI 어시스턴트(ChatGPT, Claude, Gemini 등)에 붙여넣으면 이메일과 비밀번호 없이 SaleCraft에 로그인할 수 있습니다. 토큰은 12시간 후 자동으로 만료됩니다.",
        "generatePrompt": "버튼을 눌러 전용 AI 토큰을 생성하세요.",
        "generateBtn": "AI 토큰 생성",
        "loading": "토큰 생성 중...",
        "notReady": "(아직 생성되지 않음)",
        "copyBtn": "토큰 복사",
        "copiedBtn": "복사됨!",
        "copyFailed": "자동 복사 실패. 아래 입력란을 탭하여 토큰을 선택한 후 Cmd/Ctrl+C를 누르세요.",
        "tapToSelect": "탭하여 토큰 선택",
        "regenerate": "다시 생성",
        "expiresAt": "{time}에 만료",
        "expiresSoon": "⚠️ 토큰이 곧 만료됩니다 — 다시 생성하세요",
        "singleLiveWarning": "다시 생성하면 다른 곳에 붙여넣은 토큰이 즉시 무효화됩니다. 토큰 유출이 의심될 때만 다시 생성하세요.",
        "featureUnavailable": "이 기능은 유지보수 중입니다. 이메일과 비밀번호로 로그인해 주세요.",
        "createFailed": "토큰을 생성할 수 없습니다. 나중에 다시 시도하거나 페이지를 새로고침하세요.",
    },
    "vi": {
        "title": "Sao chép AI Login Token",
        "desc": "Sau khi tạo, dán token này cho AI (ChatGPT, Claude, Gemini, v.v.) để đăng nhập SaleCraft mà không cần email/mật khẩu. Token tự hết hạn sau 12 giờ.",
        "generatePrompt": "Nhấn nút để tạo một AI Token riêng của bạn.",
        "generateBtn": "Tạo AI Token",
        "loading": "Đang tạo token...",
        "notReady": "(chưa tạo)",
        "copyBtn": "Sao chép Token",
        "copiedBtn": "Đã sao chép!",
        "copyFailed": "Sao chép tự động thất bại. Nhấn vào ô dưới để chọn token, sau đó nhấn Cmd/Ctrl+C.",
        "tapToSelect": "Nhấn để chọn Token",
        "regenerate": "Tạo lại",
        "expiresAt": "Hết hạn lúc {time}",
        "expiresSoon": "⚠️ Token sắp hết hạn — hãy tạo lại",
        "singleLiveWarning": "Tạo lại sẽ vô hiệu hóa ngay token đã dán ở nơi khác. Chỉ tạo lại khi nghi ngờ token bị lộ.",
        "featureUnavailable": "Tính năng này đang bảo trì. Vui lòng đăng nhập bằng email/mật khẩu tạm thời.",
        "createFailed": "Không thể tạo token. Vui lòng thử lại hoặc làm mới trang.",
    },
    "fr": {
        "title": "Copier votre jeton de connexion IA",
        "desc": "Après génération, collez ce jeton dans votre assistant IA (ChatGPT, Claude, Gemini, etc.) pour vous connecter à SaleCraft sans email ni mot de passe. Le jeton expire dans 12 heures.",
        "generatePrompt": "Appuyez sur le bouton pour générer votre jeton IA personnel.",
        "generateBtn": "Générer un jeton IA",
        "loading": "Génération de votre jeton...",
        "notReady": "(pas encore généré)",
        "copyBtn": "Copier le jeton",
        "copiedBtn": "Copié !",
        "copyFailed": "Échec de la copie automatique. Tapez sur le champ ci-dessous pour sélectionner le jeton, puis appuyez sur Cmd/Ctrl+C.",
        "tapToSelect": "Appuyez pour sélectionner le jeton",
        "regenerate": "Régénérer",
        "expiresAt": "Expire à {time}",
        "expiresSoon": "⚠️ Le jeton expire bientôt — veuillez régénérer",
        "singleLiveWarning": "La régénération invalide instantanément le jeton collé ailleurs. Ne régénérez qu'en cas de fuite suspectée.",
        "featureUnavailable": "Cette fonctionnalité est en maintenance. Veuillez vous connecter avec email et mot de passe pour le moment.",
        "createFailed": "Impossible de générer le jeton. Réessayez ou actualisez la page.",
    },
    "th": {
        "title": "คัดลอก AI Login Token ของคุณ",
        "desc": "หลังจากสร้างแล้ว วางโทเค็นนี้ในผู้ช่วย AI (ChatGPT, Claude, Gemini ฯลฯ) เพื่อเข้าสู่ระบบ SaleCraft โดยไม่ต้องใช้อีเมลหรือรหัสผ่าน โทเค็นจะหมดอายุใน 12 ชั่วโมง",
        "generatePrompt": "กดปุ่มเพื่อสร้าง AI Token ส่วนตัวของคุณ",
        "generateBtn": "สร้าง AI Token",
        "loading": "กำลังสร้างโทเค็น...",
        "notReady": "(ยังไม่ได้สร้าง)",
        "copyBtn": "คัดลอกโทเค็น",
        "copiedBtn": "คัดลอกแล้ว!",
        "copyFailed": "คัดลอกอัตโนมัติล้มเหลว แตะช่องด้านล่างเพื่อเลือกโทเค็น จากนั้นกด Cmd/Ctrl+C",
        "tapToSelect": "แตะเพื่อเลือกโทเค็น",
        "regenerate": "สร้างใหม่",
        "expiresAt": "หมดอายุเวลา {time}",
        "expiresSoon": "⚠️ โทเค็นใกล้หมดอายุ — โปรดสร้างใหม่",
        "singleLiveWarning": "การสร้างใหม่จะทำให้โทเค็นที่วางไว้ที่อื่นใช้ไม่ได้ทันที ใช้เฉพาะเมื่อสงสัยว่าโทเค็นรั่วไหล",
        "featureUnavailable": "ฟีเจอร์นี้อยู่ระหว่างการบำรุงรักษา กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน",
        "createFailed": "ไม่สามารถสร้างโทเค็นได้ โปรดลองอีกครั้งหรือรีเฟรชหน้า",
    },
    "es": {
        "title": "Copia tu token de inicio de sesión de IA",
        "desc": "Después de generarlo, pega este token en tu asistente de IA (ChatGPT, Claude, Gemini, etc.) para iniciar sesión en SaleCraft sin correo ni contraseña. El token expira en 12 horas.",
        "generatePrompt": "Pulsa el botón para generar tu token de IA personal.",
        "generateBtn": "Generar token de IA",
        "loading": "Generando tu token...",
        "notReady": "(aún no generado)",
        "copyBtn": "Copiar token",
        "copiedBtn": "¡Copiado!",
        "copyFailed": "Copia automática fallida. Pulsa el campo de abajo para seleccionar el token y pulsa Cmd/Ctrl+C.",
        "tapToSelect": "Pulsa para seleccionar el token",
        "regenerate": "Regenerar",
        "expiresAt": "Expira a las {time}",
        "expiresSoon": "⚠️ El token expira pronto — por favor, regenéralo",
        "singleLiveWarning": "Regenerar invalidará al instante el token que hayas pegado en otro lugar. Solo regenera si sospechas que se filtró.",
        "featureUnavailable": "Esta función está en mantenimiento. Inicia sesión con correo y contraseña por ahora.",
        "createFailed": "No se pudo generar el token. Inténtalo de nuevo o recarga la página.",
    },
    "pt": {
        "title": "Copie o seu Token de Login da IA",
        "desc": "Depois de gerado, cole este token no seu assistente de IA (ChatGPT, Claude, Gemini, etc.) para fazer login no SaleCraft sem email nem senha. O token expira em 12 horas.",
        "generatePrompt": "Pressione o botão para gerar um AI Token pessoal.",
        "generateBtn": "Gerar AI Token",
        "loading": "Gerando seu token...",
        "notReady": "(ainda não gerado)",
        "copyBtn": "Copiar Token",
        "copiedBtn": "Copiado!",
        "copyFailed": "Cópia automática falhou. Toque no campo abaixo para selecionar o token e pressione Cmd/Ctrl+C.",
        "tapToSelect": "Toque para selecionar o Token",
        "regenerate": "Regenerar",
        "expiresAt": "Expira às {time}",
        "expiresSoon": "⚠️ O token expira em breve — por favor, regenere",
        "singleLiveWarning": "Regenerar invalidará instantaneamente o token colado em outro lugar. Só regenere se suspeitar de vazamento.",
        "featureUnavailable": "Este recurso está em manutenção. Faça login com email e senha por enquanto.",
        "createFailed": "Não foi possível gerar o token. Tente novamente ou atualize a página.",
    },
    "ar": {
        "title": "انسخ رمز تسجيل دخول الذكاء الاصطناعي",
        "desc": "بعد الإنشاء، الصق هذا الرمز في مساعد الذكاء الاصطناعي (ChatGPT أو Claude أو Gemini وغيرها) لتسجيل الدخول إلى SaleCraft بدون بريد إلكتروني أو كلمة مرور. ينتهي الرمز خلال 12 ساعة.",
        "generatePrompt": "اضغط الزر لإنشاء رمز ذكاء اصطناعي خاص بك.",
        "generateBtn": "إنشاء رمز الذكاء الاصطناعي",
        "loading": "جاري إنشاء الرمز...",
        "notReady": "(لم يتم الإنشاء بعد)",
        "copyBtn": "نسخ الرمز",
        "copiedBtn": "تم النسخ!",
        "copyFailed": "فشل النسخ التلقائي. انقر على الحقل أدناه لتحديد الرمز ثم اضغط Cmd/Ctrl+C.",
        "tapToSelect": "انقر لتحديد الرمز",
        "regenerate": "إعادة الإنشاء",
        "expiresAt": "ينتهي في {time}",
        "expiresSoon": "⚠️ الرمز ينتهي قريبًا — يرجى إعادة الإنشاء",
        "singleLiveWarning": "إعادة الإنشاء ستبطل الرمز المنسوخ في أماكن أخرى فورًا. أعد الإنشاء فقط إذا اشتبهت في تسرب الرمز.",
        "featureUnavailable": "هذه الميزة قيد الصيانة. يرجى تسجيل الدخول بالبريد الإلكتروني وكلمة المرور الآن.",
        "createFailed": "تعذر إنشاء الرمز. حاول مرة أخرى أو قم بتحديث الصفحة.",
    },
    "de": {
        "title": "KI-Anmelde-Token kopieren",
        "desc": "Nach der Erstellung fügen Sie diesen Token in Ihren KI-Assistenten (ChatGPT, Claude, Gemini usw.) ein, um sich bei SaleCraft ohne E-Mail oder Passwort anzumelden. Der Token läuft in 12 Stunden ab.",
        "generatePrompt": "Drücken Sie die Schaltfläche, um einen persönlichen KI-Token zu generieren.",
        "generateBtn": "KI-Token generieren",
        "loading": "Token wird generiert...",
        "notReady": "(noch nicht generiert)",
        "copyBtn": "Token kopieren",
        "copiedBtn": "Kopiert!",
        "copyFailed": "Automatisches Kopieren fehlgeschlagen. Tippen Sie auf das Feld unten, um den Token auszuwählen, und drücken Sie Cmd/Ctrl+C.",
        "tapToSelect": "Tippen Sie, um den Token auszuwählen",
        "regenerate": "Neu generieren",
        "expiresAt": "Läuft um {time} ab",
        "expiresSoon": "⚠️ Token läuft bald ab — bitte neu generieren",
        "singleLiveWarning": "Die Neuerstellung macht den an anderer Stelle eingefügten Token sofort ungültig. Nur bei Verdacht auf Leck neu generieren.",
        "featureUnavailable": "Diese Funktion wird gewartet. Bitte melden Sie sich vorerst mit E-Mail und Passwort an.",
        "createFailed": "Token konnte nicht generiert werden. Bitte erneut versuchen oder Seite neu laden.",
    },
    "hi": {
        "title": "अपना AI लॉगिन टोकन कॉपी करें",
        "desc": "जनरेट करने के बाद, इस टोकन को अपने AI असिस्टेंट (ChatGPT, Claude, Gemini आदि) में पेस्ट करें और बिना ईमेल या पासवर्ड के SaleCraft में लॉगिन करें। टोकन 12 घंटे में समाप्त हो जाता है।",
        "generatePrompt": "अपना व्यक्तिगत AI टोकन जनरेट करने के लिए बटन दबाएं।",
        "generateBtn": "AI टोकन जनरेट करें",
        "loading": "टोकन जनरेट हो रहा है...",
        "notReady": "(अभी जनरेट नहीं हुआ)",
        "copyBtn": "टोकन कॉपी करें",
        "copiedBtn": "कॉपी हो गया!",
        "copyFailed": "स्वचालित कॉपी विफल। नीचे इनपुट पर टैप करें, टोकन चुनें, फिर Cmd/Ctrl+C दबाएं।",
        "tapToSelect": "टोकन चुनने के लिए टैप करें",
        "regenerate": "फिर से जनरेट करें",
        "expiresAt": "{time} पर समाप्त",
        "expiresSoon": "⚠️ टोकन जल्द ही समाप्त होगा — कृपया फिर से जनरेट करें",
        "singleLiveWarning": "फिर से जनरेट करने पर अन्य जगह पेस्ट किया गया टोकन तुरंत अमान्य हो जाएगा। केवल लीक के संदेह पर ही जनरेट करें।",
        "featureUnavailable": "यह सुविधा रखरखाव में है। कृपया अभी ईमेल और पासवर्ड से लॉगिन करें।",
        "createFailed": "टोकन जनरेट नहीं हो सका। कृपया पुनः प्रयास करें या पेज रिफ्रेश करें।",
    },
    "id": {
        "title": "Salin Token Login AI Anda",
        "desc": "Setelah dibuat, tempel token ini ke asisten AI Anda (ChatGPT, Claude, Gemini, dll) untuk login ke SaleCraft tanpa email atau kata sandi. Token kedaluwarsa dalam 12 jam.",
        "generatePrompt": "Tekan tombol untuk membuat AI Token pribadi Anda.",
        "generateBtn": "Buat AI Token",
        "loading": "Membuat token...",
        "notReady": "(belum dibuat)",
        "copyBtn": "Salin Token",
        "copiedBtn": "Tersalin!",
        "copyFailed": "Salin otomatis gagal. Ketuk kolom di bawah untuk memilih token, lalu tekan Cmd/Ctrl+C.",
        "tapToSelect": "Ketuk untuk memilih Token",
        "regenerate": "Buat Ulang",
        "expiresAt": "Kedaluwarsa pada {time}",
        "expiresSoon": "⚠️ Token segera kedaluwarsa — silakan buat ulang",
        "singleLiveWarning": "Membuat ulang akan langsung menonaktifkan token yang ditempel di tempat lain. Hanya buat ulang jika mencurigai kebocoran.",
        "featureUnavailable": "Fitur ini sedang dalam pemeliharaan. Silakan login dengan email dan kata sandi untuk sementara.",
        "createFailed": "Tidak dapat membuat token. Coba lagi atau segarkan halaman.",
    },
    "ms": {
        "title": "Salin Token Log Masuk AI Anda",
        "desc": "Selepas dijana, tampal token ini ke pembantu AI anda (ChatGPT, Claude, Gemini, dll) untuk log masuk ke SaleCraft tanpa e-mel atau kata laluan. Token tamat tempoh dalam 12 jam.",
        "generatePrompt": "Tekan butang untuk menjana Token AI peribadi anda.",
        "generateBtn": "Jana Token AI",
        "loading": "Menjana token...",
        "notReady": "(belum dijana)",
        "copyBtn": "Salin Token",
        "copiedBtn": "Disalin!",
        "copyFailed": "Salinan automatik gagal. Ketuk medan di bawah untuk memilih token, kemudian tekan Cmd/Ctrl+C.",
        "tapToSelect": "Ketuk untuk pilih Token",
        "regenerate": "Jana Semula",
        "expiresAt": "Tamat tempoh pada {time}",
        "expiresSoon": "⚠️ Token akan tamat tempoh — sila jana semula",
        "singleLiveWarning": "Menjana semula akan segera membatalkan token yang ditampal di tempat lain. Hanya jana semula jika disyaki bocor.",
        "featureUnavailable": "Ciri ini dalam penyelenggaraan. Sila log masuk dengan e-mel dan kata laluan buat masa ini.",
        "createFailed": "Tidak dapat menjana token. Sila cuba lagi atau segarkan halaman.",
    },
}


def migrate_one(path: Path) -> str:
    locale = path.stem
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    gs = data.get("GetStarted")
    if not gs:
        return f"[SKIP] {locale}: no GetStarted block"

    # Idempotent: if step5 already populated, assume migrated.
    if isinstance(gs.get("step5"), dict) and gs["step5"]:
        return f"[SKIP] {locale}: already migrated (step5 exists)"

    # Old step2 (Meta), step3 (Google), step4 (Topup) must all exist to migrate.
    for needed in ("step2", "step3", "step4"):
        if needed not in gs:
            return f"[SKIP] {locale}: missing {needed}, structure unexpected"

    old_step2 = gs["step2"]
    old_step3 = gs["step3"]
    old_step4 = gs["step4"]

    new_step2 = STEP2_AI_TOKEN.get(locale)
    if new_step2 is None:
        # Fallback: use English so the page renders something readable.
        new_step2 = STEP2_AI_TOKEN["en"]

    # Rebuild GetStarted with step1, new step2, shifted step3/4/5, then any
    # remaining top-level GetStarted keys (bottom, copyState, etc.).
    new_gs = OrderedDict()
    if "step1" in gs:
        new_gs["step1"] = gs["step1"]
    new_gs["step2"] = new_step2
    new_gs["step3"] = old_step2
    new_gs["step4"] = old_step3
    new_gs["step5"] = old_step4
    for k, v in gs.items():
        if k not in new_gs:
            new_gs[k] = v

    data["GetStarted"] = new_gs

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    fallback_note = " (en fallback)" if locale not in STEP2_AI_TOKEN else ""
    return f"[OK] {locale}: migrated{fallback_note}"


def main():
    for path in sorted(MESSAGES.glob("*.json")):
        print(migrate_one(path))


if __name__ == "__main__":
    main()
