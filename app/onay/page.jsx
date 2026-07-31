// Bekleme listesi onay sonucu sayfası — kişinin kayıt dilinde açılır
// (dil, onay linkiyle ve DB'deki locale alanıyla taşınır).

export const metadata = { title: "MIREC — Kayıt Onayı" };

const T = {
  tr: { okBadge: "KAYIT ONAYLANDI", okTitle: "Sıradasın.", okBody: "Perde açıldığında ilk sana haber vereceğiz. O güne dek kamera arkasını da zaman zaman paylaşacağız.", failBadge: "BAĞLANTI GEÇERSİZ", failTitle: "Bu link çalışmadı.", failBody: "Onay bağlantısı geçersiz ya da eski görünüyor. Formdan e-postanı tekrar gönderirsen yeni bir onay e-postası yollarız." },
  en: { okBadge: "SIGNUP CONFIRMED", okTitle: "You're on the list.", okBody: "We'll tell you first when the curtain rises. Until then, we'll share the occasional behind-the-scenes look.", failBadge: "INVALID LINK", failTitle: "That link didn't work.", failBody: "The confirmation link is invalid or outdated. Submit your email again from the form and we'll send a fresh one." },
  es: { okBadge: "REGISTRO CONFIRMADO", okTitle: "Estás en la lista.", okBody: "Te avisaremos primero cuando se levante el telón. Hasta entonces, compartiremos de vez en cuando el detrás de cámaras.", failBadge: "ENLACE NO VÁLIDO", failTitle: "Este enlace no funcionó.", failBody: "El enlace de confirmación no es válido o ha caducado. Envía tu correo de nuevo desde el formulario y te mandaremos uno nuevo." },
  pt: { okBadge: "INSCRIÇÃO CONFIRMADA", okTitle: "Você está na lista.", okBody: "Avisaremos você primeiro quando a cortina subir. Até lá, compartilharemos os bastidores de vez em quando.", failBadge: "LINK INVÁLIDO", failTitle: "Esse link não funcionou.", failBody: "O link de confirmação é inválido ou expirou. Envie seu email novamente pelo formulário e mandaremos um novo." },
  id: { okBadge: "PENDAFTARAN DIKONFIRMASI", okTitle: "Kamu masuk daftar.", okBody: "Kami akan memberi tahu kamu lebih dulu saat tirai dibuka. Sampai saat itu, sesekali kami bagikan momen di balik layar.", failBadge: "TAUTAN TIDAK VALID", failTitle: "Tautan ini tidak berfungsi.", failBody: "Tautan konfirmasi tidak valid atau kedaluwarsa. Kirim ulang emailmu lewat formulir dan kami kirimkan yang baru." },
  ja: { okBadge: "登録が完了しました", okTitle: "リストに登録されました。", okBody: "幕が上がるとき、最初にお知らせします。それまで、制作の舞台裏もときどきお届けします。", failBadge: "リンクが無効です", failTitle: "このリンクは機能しませんでした。", failBody: "確認リンクが無効か期限切れです。フォームからメールアドレスを再送信すると、新しい確認メールをお送りします。" },
  hi: { okBadge: "पंजीकरण की पुष्टि हुई", okTitle: "आप सूची में हैं।", okBody: "पर्दा उठते ही सबसे पहले आपको बताएंगे। तब तक कभी-कभी पर्दे के पीछे की झलक भी साझा करेंगे।", failBadge: "लिंक अमान्य", failTitle: "यह लिंक काम नहीं किया।", failBody: "पुष्टिकरण लिंक अमान्य या पुराना है। फ़ॉर्म से अपना ईमेल दोबारा भेजें, हम नया लिंक भेज देंगे।" },
};

export default function OnayPage({ searchParams }) {
  const ok = searchParams?.ok === "1";
  const t = T[searchParams?.lang] || T.en;
  return (
    <div style={{ minHeight: "100vh", background: "#070609", color: "#ECE6DA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, fontFamily: "'Manrope',sans-serif" }}>
      <img src="/logo.png" alt="MIREC" width={110} style={{ marginBottom: 30 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 3, color: ok ? "#7bbf5a" : "#E2452F", marginBottom: 18 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: ok ? "#7bbf5a" : "#E2452F" }} />
        {ok ? t.okBadge : t.failBadge}
      </div>
      <h1 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, textTransform: "uppercase", fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, margin: "0 0 16px" }}>{ok ? t.okTitle : t.failTitle}</h1>
      <p style={{ color: "#9b958a", maxWidth: 460, lineHeight: 1.6, margin: "0 0 34px" }}>{ok ? t.okBody : t.failBody}</p>
      <a href="/" style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 2, color: "#F6A93B", textDecoration: "none", border: "1px solid rgba(246,169,59,.5)", padding: "10px 22px" }}>← MIREC.ONLINE</a>
    </div>
  );
}
