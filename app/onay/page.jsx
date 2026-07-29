// Bekleme listesi onay sonucu sayfası (double opt-in linkinden yönlenilir).

export const metadata = { title: "MIREC — Kayıt Onayı" };

export default function OnayPage({ searchParams }) {
  const ok = searchParams?.ok === "1";
  return (
    <div style={{ minHeight: "100vh", background: "#070609", color: "#ECE6DA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, fontFamily: "'Manrope',sans-serif" }}>
      <img src="/logo.png" alt="MIREC" width={110} style={{ marginBottom: 30 }} />
      {ok ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 3, color: "#7bbf5a", marginBottom: 18 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#7bbf5a" }} />
            KAYIT ONAYLANDI
          </div>
          <h1 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, textTransform: "uppercase", fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, margin: "0 0 16px" }}>Sıradasın.</h1>
          <p style={{ color: "#9b958a", maxWidth: 440, lineHeight: 1.6, margin: "0 0 34px" }}>
            Perde açıldığında ilk sana haber vereceğiz. O güne dek kamera arkasını da zaman zaman paylaşacağız.
            <br /><span style={{ fontSize: 13, color: "#5f5b54" }}>You&apos;re on the list — we&apos;ll tell you first when the curtain rises.</span>
          </p>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 3, color: "#E2452F", marginBottom: 18 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E2452F" }} />
            BAĞLANTI GEÇERSİZ
          </div>
          <h1 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, textTransform: "uppercase", fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, margin: "0 0 16px" }}>Bu link çalışmadı.</h1>
          <p style={{ color: "#9b958a", maxWidth: 440, lineHeight: 1.6, margin: "0 0 34px" }}>
            Onay bağlantısı geçersiz ya da eski görünüyor. Formdan e-postanı tekrar gönderirsen yeni bir onay e-postası yollarız.
            <br /><span style={{ fontSize: 13, color: "#5f5b54" }}>The confirmation link is invalid or outdated — submit the form again for a fresh one.</span>
          </p>
        </>
      )}
      <a href="/" style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 2, color: "#F6A93B", textDecoration: "none", border: "1px solid rgba(246,169,59,.5)", padding: "10px 22px" }}>← MIREC.ONLINE</a>
    </div>
  );
}
