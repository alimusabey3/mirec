"use client";

// Çerez onay bandı + Meta Pixel yükleyici.
// Pixel YALNIZ kullanıcı "kabul" derse yüklenir (GDPR/KVKK + gizlilik politikası §9).
// Tercih localStorage'da tutulur; ret sonrası bant bir daha görünmez.

import { useEffect, useState } from "react";

const PIXEL_ID = "1416171703799421";
const KEY = "mirec_consent_ads"; // "1" kabul · "0" ret

const TXT = {
  tr: { msg: "Reklam ölçümü için Meta Pixel çerezine izin verir misin? Reddetmek siteyi kullanmanı etkilemez.", yes: "Kabul et", no: "Reddet", link: "Gizlilik politikası" },
  en: { msg: "Allow the Meta Pixel cookie for ad measurement? Declining doesn't affect your use of the site.", yes: "Accept", no: "Decline", link: "Privacy policy" },
  es: { msg: "¿Permites la cookie de Meta Pixel para medir anuncios? Rechazarla no afecta tu uso del sitio.", yes: "Aceptar", no: "Rechazar", link: "Política de privacidad" },
  pt: { msg: "Permitir o cookie do Meta Pixel para medição de anúncios? Recusar não afeta seu uso do site.", yes: "Aceitar", no: "Recusar", link: "Política de privacidade" },
  id: { msg: "Izinkan cookie Meta Pixel untuk pengukuran iklan? Menolak tidak memengaruhi penggunaan situs.", yes: "Terima", no: "Tolak", link: "Kebijakan privasi" },
  ja: { msg: "広告計測のためMeta Pixelのクッキーを許可しますか？拒否してもサイトの利用に影響はありません。", yes: "許可する", no: "拒否する", link: "プライバシーポリシー" },
  hi: { msg: "विज्ञापन मापन के लिए Meta Pixel कुकी की अनुमति दें? मना करने से साइट के उपयोग पर असर नहीं पड़ता।", yes: "स्वीकारें", no: "मना करें", link: "गोपनीयता नीति" },
};

function loadPixel() {
  if (window.fbq) return;
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,"script","https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

export default function Consent() {
  const [show, setShow] = useState(false);
  const [lang, setLang] = useState("tr");

  useEffect(() => {
    try {
      const l = localStorage.getItem("mirec_lang");
      if (TXT[l]) setLang(l);
      const c = localStorage.getItem(KEY);
      if (c === "1") loadPixel();
      else if (c !== "0") setShow(true);
    } catch { /* localStorage kapalıysa bant gösterme, pixel yükleme */ }
  }, []);

  // Footer'daki "Çerez tercihleri" linki bandı yeniden açar (onayı geri almak,
  // vermek kadar kolay olmalı). Markup dil değişiminde yeniden enjekte edildiği
  // için dinleyici delege edilir.
  useEffect(() => {
    const onClick = (e) => {
      if (e.target.closest && e.target.closest("#cookiePrefs")) {
        e.preventDefault();
        try { const l = localStorage.getItem("mirec_lang"); if (TXT[l]) setLang(l); } catch {}
        setShow(true);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!show) return null;
  const t = TXT[lang];

  function choose(accept) {
    try { localStorage.setItem(KEY, accept ? "1" : "0"); } catch {}
    setShow(false);
    if (accept) loadPixel();
    // Daha önce kabul edilip pixel yüklendiyse ve şimdi reddedildiyse: izlemeyi durdur.
    else if (window.fbq) { try { window.fbq("consent", "revoke"); } catch {} }
  }

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 950, background: "#0B0A10", borderTop: "1px solid rgba(236,230,218,.2)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", boxShadow: "0 -12px 34px rgba(0,0,0,.5)" }}>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: "#b9b3a8", lineHeight: 1.5, maxWidth: 560 }}>
        {t.msg}{" "}
        <a href="/gizlilik" target="_blank" style={{ color: "#F6A93B" }}>{t.link}</a>
      </span>
      <span style={{ display: "flex", gap: 10 }}>
        <button onClick={() => choose(false)} style={{ fontFamily: "'Space Mono',monospace", fontSize: 11.5, letterSpacing: 1, padding: "9px 16px", background: "transparent", border: "1px solid rgba(236,230,218,.3)", color: "#cfc8bb", cursor: "pointer", borderRadius: 3 }}>{t.no}</button>
        <button onClick={() => choose(true)} style={{ fontFamily: "'Space Mono',monospace", fontSize: 11.5, letterSpacing: 1, padding: "9px 18px", background: "#F6A93B", border: "1px solid #F6A93B", color: "#0a0810", cursor: "pointer", borderRadius: 3, fontWeight: 700 }}>{t.yes}</button>
      </span>
    </div>
  );
}
