// Double opt-in onayı: e-postadaki link buraya gelir; token eşleşirse kayıt
// onaylanır ve kullanıcı /onay sayfasına yönlendirilir.

import { createClient } from "@supabase/supabase-js";

export const maxDuration = 15;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req) {
  const reqUrl = new URL(req.url);
  const token = reqUrl.searchParams.get("token") || "";
  const fail = () => Response.redirect(new URL("/onay?ok=0", reqUrl), 302);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!UUID_RE.test(token) || !url || !key) return fail();

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await sb
    .from("waitlist")
    .update({ confirmed: true, confirmed_at: new Date().toISOString() })
    .eq("confirm_token", token)
    .select("id")
    .maybeSingle();

  return data ? Response.redirect(new URL("/onay?ok=1", reqUrl), 302) : fail();
}
