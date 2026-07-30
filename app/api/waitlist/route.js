// Bekleme listesi kaydı — double opt-in akışı (gizlilik politikası §3 ile uyumlu):
//   POST: e-postayı onaysız (confirmed=false) kaydeder ve Resend ile onay e-postası yollar.
//   Adres ancak /api/waitlist/onay linkine tıklanınca listeye "onaylı" girer.
// Rıza kaydı consent alanında saklanır (KVKK/ETK + GDPR kanıtı).

import { createClient } from "@supabase/supabase-js";

export const maxDuration = 15;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Onay e-postası metinleri — site dilleriyle aynı kapsam.
const MAIL = {
  tr: { subject: "MIREC — kaydını onayla", title: "Son bir adım.", body: "Bekleme listesine katılımını onaylamak için aşağıdaki butona tıkla. Onaylamazsan adresin 30 gün içinde silinir.", btn: "Kaydımı onayla", ignore: "Bu e-postayı sen istemediysen görmezden gelebilirsin." },
  en: { subject: "MIREC — confirm your signup", title: "One last step.", body: "Click the button below to confirm your spot on the waitlist. If you don't confirm, your address is deleted within 30 days.", btn: "Confirm my spot", ignore: "If you didn't request this email, you can safely ignore it." },
  es: { subject: "MIREC — confirma tu registro", title: "Un último paso.", body: "Haz clic en el botón para confirmar tu lugar en la lista de espera. Si no confirmas, tu dirección se elimina en 30 días.", btn: "Confirmar mi lugar", ignore: "Si no solicitaste este correo, puedes ignorarlo." },
  pt: { subject: "MIREC — confirme sua inscrição", title: "Um último passo.", body: "Clique no botão abaixo para confirmar seu lugar na lista de espera. Se não confirmar, seu endereço será excluído em 30 dias.", btn: "Confirmar meu lugar", ignore: "Se você não solicitou este email, pode ignorá-lo." },
  id: { subject: "MIREC — konfirmasi pendaftaranmu", title: "Satu langkah lagi.", body: "Klik tombol di bawah untuk mengonfirmasi tempatmu di daftar tunggu. Jika tidak dikonfirmasi, alamatmu dihapus dalam 30 hari.", btn: "Konfirmasi", ignore: "Jika kamu tidak meminta email ini, abaikan saja." },
  ja: { subject: "MIREC — 登録を確認してください", title: "あと一歩です。", body: "下のボタンをクリックして、ウェイトリストへの登録を確認してください。確認されない場合、アドレスは30日以内に削除されます。", btn: "登録を確認する", ignore: "このメールに心当たりがない場合は無視してください。" },
  hi: { subject: "MIREC — अपना पंजीकरण पुष्टि करें", title: "बस एक आख़िरी कदम।", body: "प्रतीक्षा सूची में अपनी जगह पक्की करने के लिए नीचे दिए बटन पर क्लिक करें। पुष्टि न करने पर आपका पता 30 दिनों में हटा दिया जाएगा।", btn: "पुष्टि करें", ignore: "यदि आपने यह ईमेल नहीं मांगा है, तो इसे अनदेखा करें।" },
};

function confirmationHtml(m, link, site) {
  return `<!doctype html><body style="margin:0;background:#070609;padding:40px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#0B0A10;border:1px solid rgba(236,230,218,.18);border-radius:8px;padding:38px 34px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
    <img src="${site}/logo.png" alt="MIREC" width="96" style="display:block;margin:0 auto 26px;">
    <h1 style="font-size:26px;line-height:1.1;color:#ECE6DA;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px;">${m.title}</h1>
    <p style="font-size:14.5px;line-height:1.6;color:#b9b3a8;margin:0 0 28px;">${m.body}</p>
    <a href="${link}" style="display:inline-block;background:#F6A93B;color:#0a0810;text-decoration:none;font-weight:bold;text-transform:uppercase;letter-spacing:1px;font-size:14px;padding:14px 34px;">${m.btn}</a>
    <p style="font-size:11.5px;line-height:1.6;color:#5f5b54;margin:28px 0 0;">${m.ignore}</p>
  </div></body>`;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const consent = Boolean(body.consent);
  const LOCALES = ["tr", "en", "es", "pt", "id", "ja", "hi"];
  const locale = LOCALES.includes(body.locale) ? body.locale : "tr";
  if (!EMAIL_RE.test(email)) return Response.json({ error: "Geçerli bir e-posta adresi gir" }, { status: 400 });
  if (!consent) return Response.json({ error: "Duyuru onayı gerekli" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !process.env.RESEND_API_KEY) {
    return Response.json({ error: "Liste şu an kapalı — daha sonra tekrar dene" }, { status: 503 });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  // Mevcut kayıt: onaylıysa bitti; değilse onay e-postasını yeniden yolla.
  const { data: existing } = await sb.from("waitlist").select("confirmed, confirm_token").eq("email", email).maybeSingle();
  let token;
  if (existing) {
    if (existing.confirmed) return Response.json({ ok: true, already: true });
    token = existing.confirm_token;
  } else {
    const { data, error } = await sb.from("waitlist").insert({ email, consent, locale }).select("confirm_token").single();
    if (error) return Response.json({ error: "Kaydedilemedi — tekrar dene" }, { status: 502 });
    token = data.confirm_token;
  }

  const site = process.env.SITE_URL || "https://mirec.online";
  const m = MAIL[locale] || MAIL.en;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "MIREC <noreply@mirec.online>",
      to: [email],
      subject: m.subject,
      html: confirmationHtml(m, `${site}/api/waitlist/onay?token=${token}&lang=${locale}`, site),
    }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    console.error("Resend hatası:", r.status, t.slice(0, 200));
    return Response.json({ error: "Onay e-postası gönderilemedi — tekrar dene" }, { status: 502 });
  }

  return Response.json({ ok: true, resent: Boolean(existing) });
}
