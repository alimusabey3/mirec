// Bekleme listesi kaydı — e-postayı Supabase'e yazar (servis anahtarı yalnız sunucuda).
// KVKK/ETK: consent alanı zorunludur ve kayıtla birlikte saklanır (rıza kaydı).
// BREVO_API_KEY tanımlıysa kişi Brevo listesine de eklenir (birincil kayıt Supabase'tir).

import { createClient } from "@supabase/supabase-js";

export const maxDuration = 15;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  if (!url || !key) return Response.json({ error: "Liste şu an kapalı — daha sonra tekrar dene" }, { status: 503 });

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await sb.from("waitlist").insert({ email, consent, locale });
  let already = false;
  if (error) {
    if (error.code === "23505") already = true; // unique ihlali: adres zaten listede
    else return Response.json({ error: "Kaydedilemedi — tekrar dene" }, { status: 502 });
  }

  if (!already && process.env.BREVO_API_KEY) {
    try {
      await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          updateEnabled: true,
          ...(process.env.BREVO_LIST_ID ? { listIds: [Number(process.env.BREVO_LIST_ID)] } : {}),
        }),
      });
    } catch { /* Brevo yan kanal; hatası kaydı geçersiz kılmaz */ }
  }

  return Response.json({ ok: true, already });
}
