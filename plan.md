# MIREC Stüdyo — Uygulama Planı

> Bu belge, MIREC landing page'inin üzerine **stüdyo uygulamasını** (auth + üretim
> modülleri + kurgu dashboard'u) inşa edecek oturum için eksiksiz spesifikasyondur.
> Kod yazmadan önce bu belgeyi baştan sona oku. Tüm UI metinleri **Türkçe**.

---

## 0. Mevcut durum (bağlam)

- **Stack:** Next.js 14.2.5 (App Router, JSX — TypeScript YOK), React 18. `@supabase/supabase-js` **zaten kurulu**.
- **Landing:** `app/CinematicLanding.jsx` — tek client component. İçerik `MARKUP = { tr, en }`
  nesnesinde ham HTML string olarak durur ve `dangerouslySetInnerHTML` ile basılır.
  Scroll animasyonları (`Cinematic` sınıfı) ve scroll-scrub videolar (`initScrubVideos`)
  DOM'a `id` ile bağlanır. **Bu dosyanın iç yapısını bozma** — sadece CTA href'leri değişecek (bkz. §12).
- **Videolar:** `public/perde_polisiye.mp4`, `perde_aksiyon.mp4`, `perde_romantik.mp4`,
  `perde_bilimkurgu.mp4` (hepsi yerel; harici link kullanılmıyor, kullanma da).
- **Stil idiomu:** Kod tabanı inline-style ağırlıklı; `app/globals.css` yalnız temel
  stiller + keyframe'ler + `.lang-toggle` içerir. Stüdyoda da aynı idiomu izle
  (inline style + gerekirse globals.css'e az sayıda class).
- **package.json script'leri** `NODE_OPTIONS=--max-http-header-size=65536` içerir
  (431 hatası düzeltmesi) — değiştirme.
- **Git:** repo `alimusabey3/mirec` (gh çoklu hesap; aktif hesap `alimusabey3` olmalı,
  push öncesi `gh auth status` kontrol et). Kullanıcı istemeden push yapma.

### Bilinen tuzaklar
- **Port 3000'de kullanıcının başka projesi (Mimosa Web) çalışıyor olabilir.**
  Doğrulama/test için sunucuyu daima **ayrı bir portta** başlat (ör. `npm run dev -- -p 3240`)
  ve `curl` ile `<title>`'ın MIREC olduğunu doğrula.
- React **Strict Mode açık** — effect'ler dev'de iki kez çalışır. Landing bunun için
  koruma içeriyor; stüdyo kodunda da idempotent effect yaz.
- Landing'in TR/EN dil düğmesi `position:fixed` (`.lang-toggle`) — **stüdyo sayfalarında
  görünmemeli.** LangToggle yalnız landing'de render ediliyor (CinematicLanding içinde),
  bu yüzden sorun çıkmaz; ama stüdyo sayfalarına landing component'ini import etme.
- Doğrulamada Playwright kullan (devDependency olarak kurulu, chromium indirilmiş).

---

## 1. Hedef mimari ve rotalar

```
app/
  page.jsx                     → landing (mevcut, dokunma)
  giris/page.jsx               → giriş ekranı
  kayit/page.jsx               → kayıt ekranı
  studio/
    layout.jsx                 → stüdyo kabuğu: sidebar + auth guard + proje seçici
    page.jsx                   → Panel: proje kartları, yeni proje
    karakterler/page.jsx       → karakter üretme modülü
    sahneler/page.jsx          → sahne üretme modülü
    sesler/page.jsx            → ses üretme modülü
    kurgu/page.jsx             → CapCut tarzı kurgu dashboard'u
  studio/ui.jsx                → paylaşılan küçük UI parçaları (Btn, Field, Tag, Empty…)
lib/
  supabase.js                  → client singleton + isSupabaseConfigured
  db.js                        → veri katmanı (Supabase ↔ localStorage çift backend)
supabase/
  schema.sql                   → tablolar + RLS (kullanıcı Supabase panelinde çalıştıracak)
.env.local.example             → NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Tüm stüdyo sayfaları **client component** (`"use client"`). Server component/SSR auth
karmaşasına girme; v1'de client-side guard yeterli.

---

## 2. Tasarım sistemi (landing'den türetilmiş)

| Token | Değer |
|---|---|
| Zemin | `#070609` (sayfa), `#0B0A10` (panel), `#0e0d14` (üst bar) |
| Metin | `#ECE6DA` (ana), `#b9b3a8` (gövde), `#9b958a` (soluk), `#7a756b` (etiket) |
| Vurgu | `#F6A93B` (altın), hover parıltısı `rgba(246,169,59,.34)` |
| Tür renkleri | polisiye `#7C9BCB`, aksiyon `#E2452F`, romantik `#FF6E9C`, bilimkurgu `#3FE6FF` |
| Kenarlık | `1px solid rgba(236,230,218,.14)` (panel), `.25` (input) |
| Fontlar | Başlık: `'Oswald'` 600/700 uppercase · Etiket/kod: `'Space Mono'` · Gövde: `'Manrope'` |
| Buton (birincil) | Altın zemin, koyu metin, Oswald 600 uppercase, letter-spacing 1px, radius 0 |
| Buton (ikincil) | Şeffaf, `1px rgba(236,230,218,.3)` kenarlık, hover'da altın kenarlık |
| Durum rozetleri | `KUYRUKTA` gri · `ÜRETİLİYOR` altın (yanıp sönen nokta, `recblink` keyframe mevcut) · `HAZIR` yeşil `#5c8a3a` · `HATA` kırmızı `#E2452F` |

Köşeler keskin (radius 0–6px), kamera-HUD hissi: Space Mono etiketler,
`·` ayraçlar, ince viewfinder çizgileri. Landing ile aynı dünyada hissettir.

---

## 2A. Tasarım brief'leri (sanat yönetimi)

> Bu bölüm "neyi" değil "nasıl hissettireceğini" tanımlar. Ölçüler §2'deki
> token'larla birleşince ekranların net resmi çıkar. Kararsız kaldığında
> landing'i aç ve "bu ekran o filmin hangi sahnesi olurdu?" diye sor.

### Genel konsept: "Kullanıcı yönetmendir"
Stüdyo bir SaaS paneli gibi değil, **bir film setinin kontrol odası** gibi
hissettirmeli. Landing kameranın vizöründen bakıyordu; stüdyo kameranın
arkasına geçiştir. Her modül setin bir departmanı: Panel = yapım ofisi,
Karakterler = cast panosu, Sahneler = çekim günlükleri (dailies),
Sesler = ses masası, Kurgu = kurgu odası.

**Işık mantığı:** Ortam karanlık bir salon; ışık yalnız içeriğin üzerinde.
Altın (`#F6A93B`) "kayıt/aksiyon" rengidir — sayfa başına 1–2 birincil CTA ve
aktif durumlarla sınırlı tut. Glow'u cömertçe değil, ödül gibi kullan
(hover, `HAZIR` anı, aktif kayıt). Geniş negatif alan bırak; kalabalık
panel = ucuz televizyon, boşluk = sinema.

**Tipografik hiyerarşi (her ekranda aynı ritim):**
1. Space Mono mini-etiket, uppercase, letter-spacing 3–4px, soluk → bağlam ("YENİ KARAKTER", "SET AKIŞI")
2. Oswald display başlık, uppercase, line-height .95 → eylem ("Sahneyi çek.")
3. Manrope gövde, 14–15px, `#b9b3a8` → açıklama
Bu üçlü landing'in imzasıdır; formlarda, boş durumlarda, modallarda tekrar et.

**Hareket dili:** Mekanik ve kesin — `0.18s ease`, hover'da `translateY(-2px)`
+ altın glow. Yaylı/bouncy easing, parallax, skeleton shimmer YOK. Durum
geçişleri anlıktır; tek "canlı" animasyon `recblink` (üretim sürerken) ve
ilerleme çubuğudur. `prefers-reduced-motion` durumunda blink ve progress
animasyonlarını sabitle.

**Durum tasarımı (her interaktif öğe için zorunlu):**
- Hover: kenarlık altına döner veya glow (buton tipine göre, §2).
- Focus: `outline: 1px solid #F6A93B; outline-offset: 2px` — form ağırlıklı
  ekranlarda klavye kullanıcısı kaybolmamalı.
- Disabled: opacity .45 + `cursor:not-allowed` (Supabase yapılandırılmamış form gibi).
- Boş durumlar birer mini sahnedir: Space Mono etiket + Oswald tek satır +
  tek CTA, dikeyde ortalanmış. Asla çıplak "Veri yok" yazma.
- Yükleniyor: spinner yerine `recblink` kırmızı nokta + Space Mono "YÜKLENİYOR".

**Metin tonu (mikro-copy):** Kısa, emir kipi, set jargonu. "Oluştur" değil
"**Sahneyi çek**", "Giriş" değil "**Perdeyi arala**", "Yükleniyor" değil
"**Işıklar hazırlanıyor**" gibi. İngilizce teknik terimleri Space Mono
etiketlerde bırak (KLING, RENDER, TAKE 01), cümle içinde Türkçeleştir.

### Ekran brief'leri

**Giriş / Kayıt — "Gişe":** Kullanıcı sinemaya girmek üzere. Sol panel sessiz
ve odaklı (tek sütun form, bol dikey boşluk, başlık büyük ama ekranı yemez);
sağ taraf perdenin aralığından sızan film (video %45–55 karartılmış, üstünde
viewfinder köşeleri + REC — landing'in HUD'u burada devam eder). Form kutuları
`#0B0A10` zemin, `.25` kenarlık; label'lar Space Mono 11px uppercase, inputun
ÜSTÜNDE (placeholder'a label görevi verme). Misafir modu linki mütevazı ama
bulunur olmalı — birincil CTA ile yarışmasın. Hata kutusu sert kırmızı değil:
koyu zemin + `#E2452F` sol şerit + Manrope metin.

**Panel — "Yapım ofisi":** Proje kartları film afişi oranına yaklaşsın
(dikeye yakın veya üstünde kalın tür şeridi). Tür şeridi kartın kimliğidir:
üst kenarda 4–6px düz renk + kart hover'ında aynı rengin zayıf glow'u. Aktif
proje "şu an çekimde" hissi vermeli: altın kenarlık + köşede `AKTİF` rozeti
(klaket gibi eğik kesilmiş köşe hoş bir dokunuş, `clip-path` ile ucuz).
Sayaçlar (karakter/sahne/ses) Space Mono'yla film metadatası gibi dizilir:
`3 KARAKTER · 5 SAHNE · 4 SES`.

**Karakterler — "Cast panosu":** Kartlar oyuncu vesikalıkları gibi eşit
boyutlu ve gridde disiplinli. Avatar bloğu karakterin "yüzü" olmadığı için
bunu saklamaya çalışma — tersine stilize et: tür renginden radyal gradyan +
büyük baş harfler, altına ince film-grain dokusu (landing'deki SVG noise
tekrar kullanılabilir). `TUTARLILIK KİLİDİ` rozeti bu sayfanın kahraman
detayıdır — altın, kilit karakteri `▣` veya CSS ile, hover'da açıklama.
Form paneli kartların SOLUNDA sabit (sticky) durur: yönetmen koltuğu hissi.

**Sahneler — "Çekim günlükleri":** Kartların üstüne Space Mono klaket satırı:
`TAKE 01 · KLING · 5SN` — sıra numarası otomatik artar. Video thumb'ı
letterbox'lı göster (üst-alt 6px siyah bant) — landing'le akraba durur.
`ÜRETİLİYOR` placeholder'ı sahnenin tür renginde nefes alan bir glow olsun
(karanlıkta pozlanan film hissi), progress bar'ı altın. Prompt textarea'sı
bu sayfanın senaryo sayfasıdır: diğer inputlardan belirgin büyük (min 96px),
Manrope ile (senaryo yazılır, kodlanmaz).

**Sesler — "Ses masası":** Satır kartlar mikser kanal şeridi gibi: solda
kind bloğu (tek harf V/M/E, tür renginde kare), ortada başlık + sahte dalga
formu (1px çubuklar; `ready` öncesi gri ve düz, `ready` sonrası renkli ve
değişken — "kayıt geldi" hissi), sağda süre + durum. Sekmeler dosya klasörü
değil **kanal seçici** gibi: alt çizgi altın, geçiş anlık. SpeechSynthesis
önizleme butonu çalarken `▶` yerine `recblink` noktası göstersin.

**Kurgu — "Kurgu odası":** Uygulamanın en karanlık ekranı — kenar paneller
`#08070c`'ye kadar iner, ışık yalnız 9:16 önizlemede ve playhead'dedir.
Landing'deki editör mock'u bu ekranın maketidir: track renkleri, playhead
üçgeni, timecode formatı birebir oradan alınır (kullanıcı landing'de gördüğü
şeyin gerçeğine kavuşur — vaat/ürün devamlılığı). Klipler dolgun ve dokunulabilir
(min 34px yükseklik V1, 22px ses), seçim altın kenarlık + hafif iç glow.
Kütüphane paneli yardımcı reji masasıdır: küçük, gri, önizlemeyle yarışmaz.
Boş timeline'da track'lerin üzerine soluk Space Mono ipuçları yaz:
`V1 — SAHNELERİNİ BURAYA EKLE`. Dışa aktar modalı fiyat panelindeki
`ÇOK YAKINDA` dilini birebir kullanır (tutarlılık).

### Yapma listesi (tasarım)
- Beyaz/açık zemin, gölgeli beyaz kart, pastel renk YOK.
- Border-radius > 8px, pill buton, gradient buton YOK.
- Emoji ikonografi YOK (CSS shape/harf blokları kullan; landing'in klaket
  logosu gibi). İkon kütüphanesi ekleme (bağımlılık büyütme).
- Aynı ekranda 2'den fazla altın dolgulu buton YOK.
- Toast kütüphanesi ekleme; geri bildirim inline rozet/ibare ile.

---

## 3. Veri katmanı

### 3.1 `lib/supabase.js`
```js
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(url && key);
export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
```

### 3.2 `lib/db.js` — çift backend
Amaç: Supabase yapılandırılmamışken veya kullanıcı **misafir modundayken** her şey
`localStorage`'da çalışsın; Supabase + oturum varsa aynı API Supabase'e gitsin.
Sayfalar yalnız bu modülü kullanır, backend'i bilmez.

```js
// Kimlik:
getSession()        → { mode: 'supabase', user } | { mode: 'guest' } | null
signOut()           // supabase.auth.signOut() + localStorage misafir bayrağını temizle
enterGuestMode()    // localStorage 'mirec_guest' = '1'; ilk girişte demo verisi tohumla

// Veri (hepsi async, aktif backend'e göre):
listProjects() / createProject({title, genre}) / deleteProject(id)
listCharacters(projectId) / createCharacter(projectId, data) / updateCharacter(id, patch) / deleteCharacter(id)
listScenes(projectId)     / createScene(projectId, data)     / updateScene(id, patch)     / deleteScene(id)
listAudio(projectId)      / createAudio(projectId, data)     / updateAudio(id, patch)     / deleteAudio(id)
loadTimeline(projectId) → timeline JSON | null
saveTimeline(projectId, timeline)   // debounce sayfada yapılır
```

**Veri şekilleri** (iki backend'de birebir aynı alanlar):
```js
project   = { id, title, genre, created_at }            // genre: 'pol'|'aks'|'rom'|'sci'
character = { id, project_id, name, role, look, style, status, created_at }
            // style: 'sinematik'|'anime'|'gerçekçi'|'noir' — status: 'queued'|'generating'|'ready'
scene     = { id, project_id, title, prompt, genre, engine, duration, status, video_url, created_at }
            // engine: 'kling'|'seedance' — duration saniye (3–12) — video_url: hazır olunca set edilir
audio     = { id, project_id, title, kind, text, voice, duration, status, created_at }
            // kind: 'seslendirme'|'muzik'|'efekt' — voice: seslendirmede seçilen ses adı
timeline  = { v1: Clip[], a1: Clip[], a2: Clip[], txt: Clip[] }
Clip      = { id, refId, kind, title, duration, color, text? }
            // refId → scene.id | audio.id (txt kliplerinde yok), text yalnız txt kliplerinde
```

- localStorage anahtarı: `mirec_db` (tek JSON), misafir bayrağı `mirec_guest`,
  aktif proje `mirec_active_project`.
- id üretimi: `crypto.randomUUID()`.
- **Misafir tohum verisi:** 1 proje ("İlk Dizim", genre 'pol') + 2 karakter +
  türlere uygun 2 hazır sahne (video_url: `/perde_polisiye.mp4`, `/perde_aksiyon.mp4`) +
  2 ses klibi (1 seslendirme 'ready', 1 müzik 'ready') + basit bir timeline.
  Böylece kurgu sayfası ilk açılışta dolu görünür.

### 3.3 `supabase/schema.sql`
```sql
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  genre text not null default 'pol',
  timeline jsonb,
  created_at timestamptz not null default now()
);
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, role text, look text, style text,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);
create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, prompt text, genre text, engine text,
  duration int not null default 5,
  status text not null default 'queued',
  video_url text,
  created_at timestamptz not null default now()
);
create table public.audio_clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, kind text not null, text text, voice text,
  duration int not null default 5,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);
alter table public.projects enable row level security;
alter table public.characters enable row level security;
alter table public.scenes enable row level security;
alter table public.audio_clips enable row level security;
-- her tabloda: select/insert/update/delete yalnız user_id = auth.uid()
create policy "own" on public.projects    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own" on public.characters  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own" on public.scenes      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own" on public.audio_clips for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```
`db.js`'in Supabase yolunda insert'lerde `user_id` alanını doldurmayı unutma.

### 3.4 `.env.local.example`
```
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 4. Simüle üretim (tüm modüllerde ortak desen)

Gerçek AI motorları henüz bağlı değil. Üretim akışı **simülasyon**:

1. Form gönderilince kayıt `status:'queued'` ile oluşturulur.
2. `setTimeout` ~1.5sn → `updateX(id, {status:'generating'})`.
3. `setTimeout` +3–5sn → `updateX(id, {status:'ready', ...sonuç})`.
   - Sahnede sonuç: türe göre video → `pol:/perde_polisiye.mp4, aks:/perde_aksiyon.mp4, rom:/perde_romantik.mp4, sci:/perde_bilimkurgu.mp4`
   - Karakterde sonuç: yok (kart "hazır" durumuna geçer; avatar = tür rengiyle gradyan + baş harfler).
   - Seste sonuç: yok (süre tahmini: seslendirmede `Math.max(2, Math.round(kelime/2.5))`).
4. Timeout'lar unmount'ta temizlenmeli; sayfa yenilenirse `queued/generating` kayıtları
   mount'ta devam ettir (basit yaklaşım: mount'ta 4sn sonra ready'ye çek).
5. Kartta durum rozeti + `ÜRETİLİYOR` iken ilerleme çubuğu (belirsiz, altın, animasyonlu).

Kod içinde tek bir `simulateGeneration(update, extraOnReady)` yardımcı fonksiyonu yaz,
üç modülde de kullan. Her karta motor/kredi etiketi koy (ör. `~4 KREDİ · KLING`).

---

## 5. Giriş / Kayıt ekranları (`/giris`, `/kayit`)

**Layout (masaüstü):** iki sütun. Sol: form paneli (max 440px, ortalanmış).
Sağ: tam yükseklik sinematik görsel — `perde_romantik.mp4` (giriş) /
`perde_bilimkurgu.mp4` (kayıt), `autoPlay muted loop playsInline`,
üstünde koyu degrade + viewfinder köşeleri + `REC` rozeti + alt köşede
Space Mono slogan ("SAHNE 01 · SENİN HİKÂYEN"). **Mobil:** video gizlenir
(`display:none` @760px), form tam genişlik.

**Form (giriş):** başlık "Perdeyi arala." (Oswald), altında Space Mono etiket
`MIREC STÜDYO · GİRİŞ`. Alanlar: E-posta, Şifre. Birincil buton "Giriş yap".
Altında: "Hesabın yok mu? **Kayıt ol**" (link `/kayit`) ve ayraçla
"**Misafir olarak dene →**" (enterGuestMode() + `router.push('/studio')`).

**Form (kayıt):** başlık "Klaketi tut." Alanlar: Ad Soyad, E-posta, Şifre (min 6).
Buton "Kayıt ol". Altında "/giris" linki + misafir modu linki.

**Davranış:**
- `supabase.auth.signInWithPassword` / `signUp` (kayıtta `options.data.display_name`).
- signUp e-posta doğrulaması gerektirirse (session null dönerse): yeşil bilgi kutusu
  "E-postana doğrulama bağlantısı gönderdik." göster, yönlendirme yapma.
- Başarılı oturum → `/studio`.
- Hatalar formun üstünde kırmızı kutuda, Türkçeleştir (en azından: invalid login
  credentials → "E-posta veya şifre hatalı.", user already registered → "Bu e-posta zaten kayıtlı.").
- `isSupabaseConfigured === false` ise: formu soluklaştırıp devre dışı bırak, üstte
  altın uyarı kutusu: "Supabase yapılandırılmamış — `.env.local` dosyasına anahtarlarını
  ekle. Şimdilik misafir modunu kullanabilirsin." Misafir butonu belirgin kalır.
- Zaten oturum varsa bu sayfalar `/studio`'ya yönlendirir.
- İki sayfada da sol üstte küçük MIREC logosu → `/` (landing'e dönüş).

---

## 6. Stüdyo kabuğu (`app/studio/layout.jsx`)

- **Guard:** mount'ta `getSession()`; null → `router.replace('/giris')`.
  Bekleme sırasında boş koyu ekran + ortada `recblink` animasyonlu nokta.
- **Sidebar** (sol, 224px, `#0B0A10`, sağ kenarlık):
  - Üstte MIREC wordmark (Oswald 700) + altında `STÜDYO` etiketi (Space Mono altın).
  - **Proje seçici:** aktif projenin adını gösteren `<select>` (tüm projeler) +
    "+ Yeni proje" seçeneği (seçilirse Panel'e gidip formu açar).
    Aktif proje id `mirec_active_project`'te; değişince `window.dispatchEvent(new Event('mirec:project'))`
    yayınla, sayfalar dinlesin (veya en basiti: seçim değişince `router.refresh()` yerine
    state'i layout'ta tutup Context ile paylaş — **Context önerilir**: `StudioContext
    { session, projects, activeProject, setActiveProject, reloadProjects }`).
  - **Nav** (Space Mono, 13px): `PANEL /studio · KARAKTERLER · SAHNELER · SESLER · KURGU`.
    Aktif rota: altın metin + solda 2px altın çubuk. `usePathname()` ile belirle.
  - Altta: kullanıcı e-postası (veya `MİSAFİR MODU` rozeti) + "Çıkış" butonu
    (signOut → `/giris`). Misafir moddaysa ufak not: "Verilerin bu tarayıcıda saklanıyor."
- **Üst bar** (yükseklik 52px, `#0e0d14`, alt kenarlık): sol tarafta kırmızı REC noktası +
  aktif sayfa adı (Space Mono uppercase), sağda aktif proje adı + tür rozeti.
- İçerik alanı: `padding: 32px 40px`, `max-width: 1200px`.
- Mobil (≤900px): sidebar üstte yatay bara dönüşür (nav yatay kaydırılabilir).
  Kusursuz olması şart değil; taşma olmasın yeter.

---

## 7. Panel (`/studio`)

- Başlık: "Projeler" (Oswald) + sağda birincil buton "+ Yeni proje".
- **Yeni proje formu** (inline panel veya modal): Ad (text) + Tür (4 tür, renkli
  radyo-kart: POLİSİYE/AKSİYON/ROMANTİK/BİLİM KURGU) → `createProject` → aktif proje yap.
- **Proje kartları** (grid `repeat(auto-fill, minmax(260px,1fr))`): tür renginde üst
  şerit, proje adı (Oswald), tür etiketi + oluşturulma tarihi (Space Mono),
  içerik sayaçları (X karakter · Y sahne · Z ses), "Aç →" (aktif yapıp `/studio/kurgu`'ya
  değil, aktif yapıp kartı vurgula) + sil (çöp ikonu, `confirm()` ile).
- Aktif proje kartı altın kenarlıkla işaretli, köşesinde `AKTİF` rozeti.
- Hiç proje yoksa: boş durum — klaket çizimi (basit CSS/emoji değil; landing'deki gibi
  CSS shape yeterli) + "İlk projeni oluştur" CTA.

---

## 8. Karakterler (`/studio/karakterler`)

**Amaç:** dizide tutarlı görünecek karakterleri tanımlamak.

- Sol/üst: **üretim formu** paneli — `YENİ KARAKTER` etiketi.
  Alanlar: Ad · Rol (kısa text, ör. "Dedektif") · Görünüm (textarea, "kısa açıklama…") ·
  Tarz (4 preset chip: Sinematik / Gerçekçi / Anime / Noir — tek seçim).
  Buton: "Karakteri üret" (`~2 KREDİ` notu).
- Gönderim → simüle üretim (bkz. §4).
- **Karakter kartları** grid'i: üstte avatar bloğu (120px, tür/tarz rengiyle
  `radial-gradient`, ortada baş harfler Oswald 700 32px), ad, rol, tarz etiketi,
  durum rozeti. `HAZIR` kartlarda altın kilit rozeti: `TUTARLILIK KİLİDİ AKTİF`
  (title attribute: "Bu karakter tüm sahnelerde aynı görünür").
- Kart aksiyonları: Sil. (Düzenleme v1'de yok.)
- Boş durum: "Henüz karakterin yok — dizinin yüzlerini burada yarat."

---

## 9. Sahneler (`/studio/sahneler`)

**Amaç:** prompt'tan video sahne üretmek.

- **Üretim formu:** Sahne adı · Prompt (textarea, placeholder: "Loş bir sokakta
  dedektif arabadan iner, neon tabelalar yanıp söner…") · Tür (4 renkli chip;
  varsayılan aktif projenin türü) · Motor (`KLING` / `SEEDANCE` — Space Mono toggle) ·
  Süre (range 3–12sn, değeri göster). İsteğe bağlı: karakter seç (hazır karakterlerden
  çoklu chip — sadece görsel, üretime etkisi yok). Buton: "Sahneyi çek" (`~4 KREDİ`).
- Gönderim → simüle üretim; `ready` olunca türe uygun video `video_url`'e yazılır (§4).
- **Sahne kartları:** 16:9 video thumb (`<video src={video_url} muted playsInline
  preload="metadata">`, hover'da oynat / mouseleave'de durdur+başa sar), başlık,
  tür+motor+süre etiket satırı, durum rozeti. `generating` iken thumb yerine
  animasyonlu placeholder (tür rengi glow + `ÜRETİLİYOR`).
- Kart aksiyonları: Sil · "Kurguya ekle →" (kurgu sayfasına gider; kurgu zaten
  kütüphaneden ekleme yaptığı için bu sadece navigasyon).
- Boş durum: "İlk sahneni çek — perde açılsın."

---

## 10. Sesler (`/studio/sesler`)

**Amaç:** seslendirme, müzik ve efekt üretmek. Motor etiketi: `ELEVENLABS`.

- Üstte 3 **sekme**: SESLENDİRME · MÜZİK · EFEKT (Space Mono, aktif altın alt çizgi).
- **Seslendirme formu:** Metin (textarea) · Ses seçimi (select: "Kerem — Derin/Anlatıcı",
  "Elif — Sıcak/Genç", "Baran — Sert/Aksiyon", "Derin — Yumuşak/Romantik") ·
  "Önizle" butonu → `speechSynthesis` ile TR sesle oku (try/catch, yoksa sessiz geç;
  ikinci basışta `cancel()`), "Üret" butonu (`~1 KREDİ`).
- **Müzik formu:** Açıklama (text, ör. "gergin synth altyapı") · Atmosfer chip'leri
  (Gerilim/Aksiyon/Duygusal/Uzay) · Süre (15/30/60sn seçim) · "Üret" (`~3 KREDİ`).
- **Efekt formu:** Açıklama (text, ör. "silah sesi, yankılı") · "Üret" (`~1 KREDİ`).
- Gönderim → simüle üretim (§4; seslendirme süresi kelime sayısından).
- **Klip listesi** (aktif sekmeye göre filtreli): satır kart — kind ikonu
  (🎙/🎵/💥 yerine CSS: renkli kare + Space Mono harf V/M/E), başlık, süre,
  ses adı (seslendirmede), sahte dalga formu (CSS: 24 adet değişken yükseklikte
  1px çubuk, `ready` iken tür renginde), durum rozeti, sil.
- Boş durum sekmeye göre metin değiştirir.

---

## 11. Kurgu — CapCut tarzı dashboard (`/studio/kurgu`)

**En kritik sayfa.** Landing'deki editör mock'unun (SAHNE_KURGU.proj) canlı hali.

### Yerleşim
```
┌────────────────────────────────────────────────────────────┐
│ ÜST BAR: ● proj adı · timecode (Space Mono) · ▶/⏸ · Dışa aktar │
├───────────────┬────────────────────────────────────────────┤
│ KÜTÜPHANE     │  ÖNİZLEME (9:16, ortalanmış, max ~340px    │
│ [Sahneler]    │  genişlik; siyah çerçeve + ince altın      │
│ [Sesler]      │  kenarlık; altında küçük timecode)         │
│ liste, her    │                                            │
│ öğede "+ V1"  │                                            │
│ / "+ A1/A2"   │                                            │
├───────────────┴────────────────────────────────────────────┤
│ TIMELINE: cetvel (saniye işaretleri) + playhead (altın)    │
│  V1 │███ sahne1 ███│██ sahne2 ██│                          │
│  A1 │≈≈ seslendirme ≈≈│                                    │
│  A2 │≈≈≈≈≈≈ müzik ≈≈≈≈≈≈│                                  │
│  TXT│▪ altyazı ▪│        [+ Altyazı ekle]                  │
└────────────────────────────────────────────────────────────┘
```

### Veri ve davranış
- Timeline state: §3.2'deki `timeline` şekli. Mount'ta `loadTimeline(activeProject.id)`,
  her değişiklikte 800ms debounce ile `saveTimeline`. Üst barda "Kaydedildi ✓" soluk ibaresi.
- **Kütüphane:** sol panel, iki sekme. Yalnız `status:'ready'` öğeler listelenir.
  Sahne satırı: mini thumb + ad + süre + `+ Ekle` (V1 sonuna ekler).
  Ses satırı: ad + süre + kind; seslendirme/efekt → `+ A1`, müzik → `+ A2`.
  Eklenen klip: `{ id: randomUUID(), refId, kind, title, duration, color }`
  (renkler: V1 `#5a6f96`, A1 `#2e6b4a`, A2 `#6b4a2e`, TXT `#6b6b2e` — landing mock'uyla aynı).
- **Klip görünümü:** genişlik = `duration * pxPerSec` (pxPerSec ~40, sabit yeterli;
  zoom v1'de yok). İçinde başlık (taşarsa ellipsis) + süre etiketi.
- **Seçim:** klik → altın kenarlık; seçiliyken üstte mini araç çubuğu:
  `◀ / ▶` (aynı track içinde sola/sağa taşı — dizide yer değiştir),
  `−1sn / +1sn` (min 1sn, video kliplerde max = sahnenin gerçek süresi bilinmiyorsa 15sn),
  `Sil`. Drag&drop **yapma** (v1 kapsam dışı — buton tabanlı yeterli ve sağlam).
- **TXT track:** `+ Altyazı ekle` → inline mini form (metin + süre) → track sonuna eklenir.
- **Playhead & oynatma:**
  - Cetvele/track alanına tıklayınca playhead oraya gider (`offsetX / pxPerSec`).
  - ▶: `requestAnimationFrame` ile playhead gerçek zamanda ilerler; toplam süre =
    en uzun track'in bitişi; sona gelince durur.
  - **Önizleme:** playhead V1'de hangi klibe denk geliyorsa o sahnenin videosu
    gösterilir (`video.src = scene.video_url`), `currentTime = playhead - klipBaşlangıcı`
    (yalnız pause/seek anında set et; oynarken videoyu `play()` ile bırak, klip sınırında
    kaynak değiştir). Klip yoksa siyah + `SİNYAL YOK` (Space Mono, soluk).
  - **Altyazı overlay:** playhead TXT klibinin aralığındaysa metni önizlemenin altına
    bindir (Manrope 14px, yarı saydam siyah şerit).
  - Ses trackleri v1'de **görseldir** (gerçek mixdown yok). İsteğe bağlı süsleme:
    oynatma sırasında playhead bir seslendirme klibinin başına girdiğinde
    `speechSynthesis.speak(clip.title'a bağlı metin)` — ancak ref audio kaydındaki
    `text` alanını kullan; hata olursa sessizce geç. (Vazgeçilebilir.)
- **Dışa aktar** butonu → modal: "Dışa aktarma çok yakında — kurgun kaydedildi."
  (`ÇOK YAKINDA` altın rozetiyle, landing'deki fiyat paneliyle aynı dil.)
- Aktif proje yoksa sayfa boş durum gösterir: "Önce bir proje seç veya oluştur" + Panel linki.

### Timecode
Landing'deki format korunur: `HH:MM:SS:FF` (24fps). Yardımcı: saniye → `00:00:04:12`.

---

## 12. Landing entegrasyonu

`app/CinematicLanding.jsx` içindeki `MARKUP` string'lerinde (hem `tr` hem `en`):
- Hero "Sahneni kur" / "Build your scene": `href="#pricing"` → `href="/kayit"`
- Final "Hemen başla" / "Get started": `href="#"` → `href="/kayit"`
- **Dikkat:** Bu değişiklikleri string replace ile yap ve her replace'in tam 1 kez
  eşleştiğini doğrula (bu kod tabanındaki yerleşik desen: script'le değiştir, sayıyı logla).
- Landing'e küçük bir "Giriş" linki eklemek isteğe bağlı (sağ üst HUD zaten kalabalık —
  eklenmeyecekse dokunma).

---

## 13. Uygulama sırası

1. `lib/supabase.js` + `lib/db.js` + `supabase/schema.sql` + `.env.local.example`
2. `/giris` + `/kayit`
3. `studio/layout.jsx` (guard + sidebar + context) + `studio/ui.jsx`
4. `/studio` (panel/projeler)
5. `/studio/karakterler`
6. `/studio/sahneler`
7. `/studio/sesler`
8. `/studio/kurgu`
9. Landing CTA'ları (§12) + README güncellemesi
10. Doğrulama (§14)

Her adımdan sonra `npm run build` hızlı sözdizimi kontrolü için değerli;
en azından 2, 4, 8 ve 9'dan sonra çalıştır.

## 14. Doğrulama (tamamlanma kriterleri)

Playwright ile (ayrı portta, ör. 3240) **misafir modu akışı** uçtan uca:
1. `/giris` açılır → "Misafir olarak dene" → `/studio`'ya düşer, tohum proje görünür.
2. Panel'de yeni proje oluştur → kart görünür, aktif olur.
3. Karakterler: form doldur → kart `ÜRETİLİYOR` → ~5sn sonra `HAZIR` + kilit rozeti.
4. Sahneler: prompt gir, tür seç → `HAZIR` olunca kartta video oynuyor (yerel mp4).
5. Sesler: seslendirme üret → listede `HAZIR`.
6. Kurgu: kütüphaneden sahneyi V1'e, sesi A1'e ekle → klipler doğru genişlikte;
   playhead tıklamayla gidiyor; ▶ ile önizlemede video oynuyor; altyazı ekle →
   overlay görünüyor; sayfayı yenile → timeline korunmuş (localStorage).
7. `/studio`'ya oturumsuz+misafirsiz erişim → `/giris`'e yönlenir
   (localStorage temiz bir context'te test et).
8. Landing hâlâ sağlam: `/` yüklenir, konsol hatası yok, scrub videolar çalışır,
   "Sahneni kur" `/kayit`'a gider.
9. Ekran görüntüleri al ve **gözle incele** (giriş, kayıt, panel, üç modül, kurgu —
   masaüstü 1280px + mobil 390px). Çakışma/taşma/okunmazlık ara; bulursan düzelt.
10. Konsol hatası 0 · başarısız istek 0 · `npm run build` temiz.

Supabase gerçek testi kullanıcının anahtar eklemesini bekler; kod yolu hazır olsun,
README'de kurulum adımları anlatılsın (proje aç → schema.sql çalıştır → .env.local doldur).

## 15. Kapsam dışı (v1'de yapma)

- Gerçek AI üretimi (Kling/Seedance/ElevenLabs API çağrıları) — arayüzler hazır, motorlar sonra.
- Timeline'da drag&drop, zoom, dalga formu analizi, gerçek ses mixdown/export.
- Stüdyo için EN dil desteği (landing'deki TR/EN kalır; stüdyo TR).
- E-posta dışı auth sağlayıcıları (Google vs.).
- Sunucu tarafı render/SSR auth, middleware.
