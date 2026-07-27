// Landing çeviri hattı: EN markup'ı bölüm bölüm OpenAI'a çevirtir,
// app/landing-i18n.json'a yazar. TR/EN elle yazılmıştır, dokunulmaz.
//
// Kullanım:  node scripts/translate-landing.mjs            (tüm eksik diller)
//            node scripts/translate-landing.mjs es pt      (sadece verilenler)
// Anahtar:   .env dosyasındaki OPENAI_API_KEY (sunucu anahtarıyla aynı).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { MARKUP } from "../app/landing-markup.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "app", "landing-i18n.json");

// .env'i elle oku (bağımlılık eklememek için)
const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env"), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")])
);
const KEY = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
if (!KEY) { console.error("OPENAI_API_KEY bulunamadı (.env)"); process.exit(1); }
const MODEL = env.OPENAI_MODEL || "gpt-4o-mini";

const TARGETS = {
  es: "Latin American Spanish (neutral, es-419)",
  pt: "Brazilian Portuguese (pt-BR)",
  id: "Indonesian (Bahasa Indonesia)",
  ja: "Japanese (natural marketing tone, ですます調)",
  hi: "Hindi (Devanagari script, natural marketing tone)",
};

const SYSTEM = (langName) => `You are a professional website localizer for a cinematic AI micro-drama studio called MIREC.
Translate the user's HTML fragment into ${langName}.
STRICT RULES:
- Preserve ALL HTML tags, attributes, inline styles, ids, classes, entities and HTML comments EXACTLY as-is.
- Translate ONLY human-visible text nodes, plus these human-readable attribute values: placeholder, aria-label, title, alt, data-ok, data-dup, data-err, data-noconsent.
- Never translate: the brand "MIREC", product names (Kling, Seedance, ElevenLabs, OpenAI), file paths, URLs, CSS values, timecodes like 00:00:00:00, "REC".
- Keep marketing copy punchy and idiomatic — a film-set voice, not literal translation.
- Do not add, remove or reorder elements. Return ONLY the translated HTML fragment, no code fences, no commentary.`;

async function callOpenAI(langName, chunk, attempt = 1) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM(langName) },
        { role: "user", content: chunk },
      ],
    }),
  });
  if (!r.ok) {
    if (attempt < 3) { await new Promise((res) => setTimeout(res, 1500 * attempt)); return callOpenAI(langName, chunk, attempt + 1); }
    throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0, 200)}`);
  }
  const j = await r.json();
  let out = j.choices?.[0]?.message?.content || "";
  out = out.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, ""); // olası çit temizliği
  return out;
}

// Kaba yapı doğrulaması: tag sayıları ve kritik id'ler korunmuş mu?
function validate(orig, out) {
  const count = (s, re) => (s.match(re) || []).length;
  for (const re of [/<div/g, /<section/g, /<form/g, /<input/g, /<video/g]) {
    if (count(orig, re) !== count(out, re)) return `tag sayısı değişti: ${re}`;
  }
  for (const id of ["wlForm", "wlEmail", "timecode"]) {
    if (orig.includes(`id=\"${id}\"`) && !out.includes(`id=\"${id}\"`)) return `id kayboldu: ${id}`;
  }
  return null;
}

// Bölüm ayraçlarından parçala (~2-6KB parçalar)
function chunkify(html) {
  const parts = html.split(/(?=<!-- ==+)/);
  const merged = [];
  for (const p of parts) {
    if (merged.length && merged[merged.length - 1].length + p.length < 3000) merged[merged.length - 1] += p;
    else merged.push(p);
  }
  return merged;
}

const existing = JSON.parse(readFileSync(OUT, "utf8"));
const requested = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TARGETS);
const en = MARKUP.en;
const chunks = chunkify(en);
console.log(`EN markup ${en.length} karakter · ${chunks.length} parça · model: ${MODEL}`);

for (const code of requested) {
  if (!TARGETS[code]) { console.warn(`bilinmeyen dil atlandı: ${code}`); continue; }
  console.log(`\n→ ${code} (${TARGETS[code]}) çevriliyor…`);
  const out = [];
  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`  parça ${i + 1}/${chunks.length}… `);
    const t = await callOpenAI(TARGETS[code], chunks[i]);
    const err = validate(chunks[i], t);
    if (err) { console.error(`DOĞRULAMA HATASI (${err}) — bu parça İngilizce bırakıldı`); out.push(chunks[i]); }
    else { console.log("ok"); out.push(t); }
  }
  existing[code] = out.join("");
  writeFileSync(OUT, JSON.stringify(existing));
  console.log(`✓ ${code} yazıldı (${existing[code].length} karakter)`);
}
console.log("\nBitti → app/landing-i18n.json");
