# MIREC — Sinematik Landing (Next.js)

`PERDE_-_Sinematik_Landing_6.html` dosyasındaki tek sayfalık, scroll-tabanlı
sinematik landing page'in Next.js (App Router) sürümü.

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

## Yapı

| Dosya | Görevi |
|------|--------|
| `app/layout.jsx` | HTML iskeleti, meta etiketleri, Google Fonts (Manrope, Oswald, Space Mono) |
| `app/globals.css` | Temel stiller ve keyframe animasyonları (`recblink`, `grainshift`, `spin`, `portalpulse`, ...) |
| `app/page.jsx` | Ana sayfa — `CinematicLanding` bileşenini render eder |
| `app/CinematicLanding.jsx` | Tüm sayfa markup'ı + scroll animasyon denetleyicisi (client component) |

## Notlar

- Orijinal dosya bir "bundler" çıktısıydı; gerçek içerik base64/gzip ile
  paketlenmiş bir template içindeydi. İçerik çıkarılıp Next.js'e taşındı.
- Gömülü woff2 fontlar yerine Google Fonts CDN kullanılıyor (aynı aileler).
- Animasyonlar orijinaldeki `DCLogic` sınıfının birebir portudur: `useEffect`
  içinde bir `requestAnimationFrame` döngüsü scroll konumunu okuyup sahneleri
  (polisiye, samuray/aksiyon, romantik, bilim kurgu, editör) yönetir. Element'lere
  `id` üzerinden erişildiği için markup `dangerouslySetInnerHTML` ile birebir
  korunmuştur.

### Scroll-scrub videolar

Her tür sahnesinde scroll'a bağlı **scrub video** vardır: scroll ilerledikçe
videonun `currentTime`'ı kayar (`initScrubVideos`, orijinal script'in birebir
portu). Videolar sahnenin CSS silüetlerinin yerini alır.

| Sahne | Yerel dosya (`public/`) | Yedek |
|------|--------------------------|-------|
| Polisiye | `perde_polisiye.mp4` (yoksa CDN) | CloudFront |
| Aksiyon (samuray sahnesi) | `perde_aksiyon.mp4` ✔ | CloudFront |
| Romantik | `perde_romantik.mp4` (yoksa CDN) | CloudFront |
| Bilim Kurgu | `perde_bilimkurgu.mp4` (yoksa CDN) | CloudFront |

- Her `<video>` iki kaynakla oluşturulur: önce `public/`'teki yerel dosya, o yoksa
  CloudFront CDN URL'si. Şu an yalnızca `perde_aksiyon.mp4` yerelde; diğer üçü
  CDN'den yüklenir (test edildi, üçü de erişilebilir).
- Kendi videolarını kullanmak istersen `perde_polisiye.mp4`, `perde_romantik.mp4`,
  `perde_bilimkurgu.mp4` dosyalarını `public/` içine koyman yeterli; kod otomatik
  yereli tercih eder.
- Not: `perde_aksiyon_1.mp4` orijinal script tarafından referans verilmiyor
  (yalnızca `perde_aksiyon.mp4` kullanılıyor).
