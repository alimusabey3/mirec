// Double opt-in onayı: e-postadaki link buraya gelir; token eşleşirse kayıt
// onaylanır ve kullanıcı /onay sayfasına yönlendirilir.

import { createClient } from "@supabase/supabase-js";

export const maxDuration = 15;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LOCALES = ["tr", "en", "es", "pt", "id", "ja", "hi"];

export async function GET(req) {
  const reqUrl = new URL(req.url);
  const token = reqUrl.searchParams.get("token") || "";
  const linkLang = LOCALES.includes(reqUrl.searchParams.get("lang")) ? reqUrl.searchParams.get("lang") : "en";
  const fail = () => Response.redirect(new URL(`/onay?ok=0&lang=${linkLang}`, reqUrl), 302);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!UUID_RE.test(token) || !url || !key) return fail();

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await sb
    .from("waitlist")
    .update({ confirmed: true, confirmed_at: new Date().toISOString() })
    .eq("confirm_token", token)
    .select("locale")
    .maybeSingle();

  if (!data) return fail();
  const lang = LOCALES.includes(data.locale) ? data.locale : linkLang;
  return Response.redirect(new URL(`/onay?ok=1&lang=${lang}`, reqUrl), 302);
}
