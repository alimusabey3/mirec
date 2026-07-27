# MIREC — Yapay Zekâ Mikro-Dizi Stüdyosu (Next.js)

İki parçadan oluşur:

1. **Landing** (`/`) — scroll-tabanlı sinematik tanıtım sayfası
   (`PERDE_-_Sinematik_Landing_6.html` dosyasından port edildi).
2. **Stüdyo** (`/studio`) — giriş/kayıt, karakter–sahne–ses üretim modülleri ve
   CapCut tarzı kurgu dashboard'u. Ayrıntılı spesifikasyon: `plan.md`.

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000
```

Prodüksiyon:

```bash
npm run build
npm run start
```

## Stüdyo

| Rota | Görevi |
|------|--------|
| `/giris`, `/kayit` | Supabase e-posta/şifre auth + **misafir modu** |
| `/studio` | **Panel = Kurgu**: üstte açılır "PROJELER" şeridi (kartlar + yeni proje), altında kurgu dashboard'u — 9:16 önizleme, kütüphane, V1/A1/A2/TXT timeline, playhead, altyazı, otomatik kayıt |
| `/studio/senaryo` | **Senaryo Agentı** (OpenAI, iki aşamalı): **1) Taslak** — fikir + bölüm sayısı (1–30) + **bölüm süresi (1 / 1.5 dk)** → her bölüm için başlık + dramatik yay + özet taslağı sunulur. **2) Plan** — bölüm bölüm veya toptan "Sahneleri planla": sahne sayısı ve süreleri (5–8sn) **seçilen bölüm süresini dolduracak şekilde** planlanır (sunucu, süre toplamını hedefe eşitler) + sahne başına otomatik **video prompt'u**. **"Otomatik üret + kurguya diz"** tek tıkla sahneleri oluşturur, üretir ve kurguda V1'e dizer |
| `/studio/karakterler` | Karakter üretme (tarz preset'leri, tutarlılık kilidi) — hazır cast, senaryo agentının sahnelerine otomatik dokunur |
| `/studio/sahneler` | Sahne üretme (prompt, tür, Kling/Seedance, süre) |
| `/studio/sesler` | Ses üretme (seslendirme/müzik/efekt, SpeechSynthesis önizleme) |
| `/studio/kurgu` | → `/studio`'ya yönlenir (kurgu artık panelin kendisi) |

- **Misafir modu:** Supabase yapılandırılmasa bile her şey `localStorage`'da
  çalışır (giriş ekranında "Misafir olarak dene"). İlk girişte örnek bir proje
  tohumlanır; kurgu ekranı dolu açılır.
- **Senaryo üretimi gerçektir:** `/studio/senaryo`, sunucu tarafındaki
  `/api/senaryo` route'u üzerinden **OpenAI** ile senaryo + video prompt'u
  üretir. `.env` dosyasına `OPENAI_API_KEY` koy (tarayıcıya gitmez; model
  `OPENAI_MODEL` ile değiştirilebilir, varsayılan `gpt-4o-mini`). API'ye
  ulaşılamazsa yerel şablon taslağına düşer ve arayüz uyarı gösterir.
- **Video/ses üretimi simülasyondur:** Kling/Seedance/ElevenLabs henüz bağlı
  değil; üretimler `kuyruk → üretiliyor → hazır` akışıyla simüle edilir. Sahne
  sonuçları türe göre `public/` altındaki yerel videolardır.

### Supabase kurulumu (opsiyonel — gerçek hesaplar için)

1. [supabase.com](https://supabase.com) üzerinde yeni proje aç.
2. SQL Editor'de `supabase/schema.sql` dosyasını çalıştır (tablolar + RLS).
3. `.env.local.example` → `.env.local` kopyala, proje URL + anon key gir.
4. Sunucuyu yeniden başlat. Kayıt/giriş artık Supabase'e gider; veri katmanı
   (`lib/db.js`) otomatik olarak Supabase backend'ine geçer.

## Yapı

| Dosya | Görevi |
|------|--------|
| `app/layout.jsx` | HTML iskeleti, meta etiketleri, Google Fonts (Manrope, Oswald, Space Mono) |
| `app/globals.css` | Temel stiller, keyframe'ler, stüdyo/auth yardımcı sınıfları |
| `app/page.jsx` | Ana sayfa — `CinematicLanding` bileşenini render eder |
| `app/CinematicLanding.jsx` | Landing markup'ı + scroll animasyon denetleyicisi (client component) |
| `app/AuthScreen.jsx` | Giriş/kayıt ortak ekranı ("gişe" düzeni) |
| `app/studio/layout.jsx` | Stüdyo kabuğu: guard, sidebar, proje seçici, context |
| `app/studio/ui.jsx` | Paylaşılan UI parçaları + tasarım token'ları |
| `lib/supabase.js` | Supabase client (env yoksa `null` → misafir modu) |
| `lib/db.js` | Veri katmanı — Supabase ↔ localStorage çift backend |
| `supabase/schema.sql` | Tablolar + RLS politikaları |

## Notlar

- Orijinal dosya bir "bundler" çıktısıydı; gerçek içerik base64/gzip ile
  paketlenmiş bir template içindeydi. İçerik çıkarılıp Next.js'e taşındı.
- Gömülü woff2 fontlar yerine Google Fonts CDN kullanılıyor (aynı aileler).
- Animasyonlar orijinaldeki `DCLogic` sınıfının birebir portudur: `useEffect`
  içinde bir `requestAnimationFrame` döngüsü scroll konumunu okuyup sahneleri
  (polisiye, samuray/aksiyon, romantik, bilim kurgu, editör) yönetir. Element'lere
  `id` üzerinden erişildiği için markup `dangerouslySetInnerHTML` ile birebir
  korunmuştur.

### Dil desteği (TR / EN)

Sağ üst-ortadaki **TR / EN** düğmesiyle dil değişir. Markup iki dilde tutulur
(`MARKUP.tr` / `MARKUP.en`) ve dil değişince `key={lang}` ile tüm bölüm yeniden
mount edilir; scroll kontrolcüsü ve scrub videolar yeni DOM'a yeniden bağlanır
(eski `requestAnimationFrame` döngüleri, videoları DOM'dan çıkınca kendini
durdurur). Seçim `localStorage`'a (`mirec_lang`) yazılır. Varsayılan: Türkçe.

- Metin düzenlemek için: `app/CinematicLanding.jsx` içindeki `MARKUP` nesnesi.

### Scroll-scrub videolar

Her tür sahnesinde scroll'a bağlı **scrub video** vardır: scroll ilerledikçe
videonun `currentTime`'ı kayar (`initScrubVideos`, orijinal script'in birebir
portu). Videolar sahnenin CSS silüetlerinin yerini alır.

| Sahne | Yerel dosya (`public/`) |
|------|--------------------------|
| Polisiye | `perde_polisiye.mp4` |
| Aksiyon | `perde_aksiyon.mp4` |
| Romantik | `perde_romantik.mp4` |
| Bilim Kurgu | `perde_bilimkurgu.mp4` |

- **Tüm videolar yereldir** (`public/` içinde); harici/CloudFront linki yoktur.
  Her `<video>` tek bir yerel `<source>` ile oluşturulur.
- Videoyu değiştirmek için ilgili dosyayı `public/` içinde aynı adla değiştirmen
  yeterli.
- Not: `perde_aksiyon_1.mp4` orijinal script tarafından referans verilmiyor
  (yalnızca `perde_aksiyon.mp4` kullanılıyor).
