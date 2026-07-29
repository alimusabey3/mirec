// Gizlilik Politikası — statik sayfa. Metin kullanıcı tarafından sağlandı;
// [KÖŞELİ PARANTEZLİ] alanlar yayına almadan önce doldurulmalıdır.

export const metadata = {
  title: "Privacy Policy — MIREC",
  description: "How MIREC collects, uses and protects your personal data.",
};

const C = {
  bg: "#070609", panel: "#0B0A10", text: "#b9b3a8", head: "#ECE6DA",
  dim: "#7a756b", gold: "#F6A93B", border: "1px solid rgba(236,230,218,.14)",
};

function H2({ children }) {
  return <h2 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, textTransform: "uppercase", fontSize: 22, color: C.head, margin: "40px 0 12px", letterSpacing: 0.5 }}>{children}</h2>;
}
function P({ children }) {
  return <p style={{ margin: "0 0 14px", lineHeight: 1.7 }}>{children}</p>;
}
function LI({ children }) {
  return <li style={{ margin: "0 0 8px", lineHeight: 1.65 }}>{children}</li>;
}
function Mark({ children }) {
  // Doldurulması gereken alan — yayına almadan önce değiştir.
  return <span style={{ color: C.gold, background: "rgba(246,169,59,.08)", padding: "0 4px" }}>{children}</span>;
}

export default function GizlilikPage() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "'Manrope',sans-serif", fontSize: 15 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <a href="/" style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 2, color: C.dim, textDecoration: "none" }}>← MIREC</a>
        <h1 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, textTransform: "uppercase", fontSize: "clamp(34px,6vw,52px)", lineHeight: 0.95, color: C.head, margin: "18px 0 10px" }}>Privacy Policy</h1>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11.5, letterSpacing: 1, color: C.dim, marginBottom: 28 }}>Last updated: July 29, 2026</div>

        <P>This policy explains what personal data MIREC collects through mirec.online, why we collect it, and what rights you have over it.</P>
        <P>MIREC is an early-stage project operated by <strong style={{ color: C.head }}>Ali Musabeyoğlu</strong>, based in <Mark>[city]</Mark>, Türkiye. In this policy, &quot;we&quot;, &quot;us&quot;, and &quot;MIREC&quot; refer to that operator, who is the data controller for the personal data described below.</P>
        <P>MIREC is not yet incorporated as a company. If a company is later formed to operate MIREC, it will become the data controller, and your data will be transferred to it on the same terms set out in this policy. We will update this page and notify subscribers by email before that transfer takes effect.</P>
        <P>If you have any questions about this policy or your data, contact us at <a href="mailto:privacy@mirec.online" style={{ color: C.gold }}>privacy@mirec.online</a>.</P>

        <H2>1. What we collect</H2>
        <P>MIREC is currently in pre-launch. The only personal data we collect is what you give us when you join the waitlist:</P>
        <div style={{ overflowX: "auto", margin: "0 0 14px" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
            <thead>
              <tr>
                {["Data", "How we get it", "Why"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: `2px solid rgba(246,169,59,.4)`, fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 1, color: C.head }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Email address", "You enter it in the waitlist form", "To notify you when MIREC launches and to send occasional product updates"],
                ["Language preference", "Detected from the site language you are viewing", "To send you emails in your language"],
                ["Consent record", "Recorded when you confirm your subscription", "To prove your consent was freely given, as required by law"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "10px 12px", borderBottom: C.border, verticalAlign: "top", lineHeight: 1.55 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>We also collect limited, aggregated analytics about site usage (pages viewed, approximate country, referring site, device type). This data is not used to identify you individually.</P>
        <P>We do <strong style={{ color: C.head }}>not</strong> collect names, phone numbers, payment details, or account credentials. We do not sell personal data, and we do not use your data for advertising profiling.</P>

        <H2>2. Legal basis for processing</H2>
        <P>If you are in the European Economic Area or the United Kingdom, we rely on the following legal bases under the GDPR:</P>
        <ul style={{ paddingLeft: 22, margin: "0 0 14px" }}>
          <LI><strong style={{ color: C.head }}>Consent</strong> (Art. 6(1)(a)) — for sending you launch and product emails. You give this consent by submitting the waitlist form and confirming it via the email we send you. You can withdraw it at any time.</LI>
          <LI><strong style={{ color: C.head }}>Legitimate interests</strong> (Art. 6(1)(f)) — for aggregated analytics that help us understand how the site is used and keep it secure. We have assessed that this does not override your rights, as the data is not used to identify or target individuals.</LI>
        </ul>
        <P>If you are elsewhere, we process your data on the equivalent basis available under your local law.</P>

        <H2>3. Double opt-in</H2>
        <P>When you submit the waitlist form, we send a confirmation email. Your address is added to our list <strong style={{ color: C.head }}>only</strong> after you click the confirmation link. If you never confirm, the unconfirmed address is deleted within 30 days.</P>

        <H2>4. Who we share data with</H2>
        <P>We do not sell or rent your data. We share it only with service providers who process it on our behalf, under contract, and only to the extent needed to run the service:</P>
        <ul style={{ paddingLeft: 22, margin: "0 0 14px" }}>
          <LI><strong style={{ color: C.head }}>Brevo</strong> — stores our mailing list and delivers our emails.</LI>
          <LI><strong style={{ color: C.head }}>Vercel</strong> — hosts the website and processes server logs.</LI>
          <LI><Mark>[Analytics provider, if used]</Mark> — provides aggregated site usage statistics.</LI>
        </ul>
        <P>We may also disclose data where we are legally required to do so, for example in response to a valid legal request.</P>

        <H2>5. International transfers</H2>
        <P>Our service providers may store or process data outside your country, including in the United States. Where we transfer personal data out of the EEA or UK, we rely on appropriate safeguards such as the European Commission&apos;s Standard Contractual Clauses, or on an adequacy decision where one applies. You can request more detail about these safeguards using the contact address above.</P>

        <H2>6. How long we keep it</H2>
        <ul style={{ paddingLeft: 22, margin: "0 0 14px" }}>
          <LI><strong style={{ color: C.head }}>Waitlist emails:</strong> until you unsubscribe, or until 24 months after launch if you have not opened or clicked any of our emails in that period — whichever comes first.</LI>
          <LI><strong style={{ color: C.head }}>Unconfirmed sign-ups:</strong> deleted within 30 days.</LI>
          <LI><strong style={{ color: C.head }}>Consent records:</strong> kept for as long as we process your data, plus the period required to demonstrate compliance.</LI>
          <LI><strong style={{ color: C.head }}>Analytics:</strong> retained in aggregated form only.</LI>
        </ul>
        <P>When you unsubscribe, we keep a minimal suppression record (a hashed version of your email) so that we do not accidentally email you again. This is a legal requirement in several jurisdictions.</P>

        <H2>7. Your rights</H2>
        <P>Depending on where you live, you may have the right to:</P>
        <ul style={{ paddingLeft: 22, margin: "0 0 14px" }}>
          <LI><strong style={{ color: C.head }}>Access</strong> the personal data we hold about you</LI>
          <LI><strong style={{ color: C.head }}>Correct</strong> data that is inaccurate or incomplete</LI>
          <LI><strong style={{ color: C.head }}>Delete</strong> your data (&quot;right to erasure&quot;)</LI>
          <LI><strong style={{ color: C.head }}>Restrict or object</strong> to how we process it</LI>
          <LI><strong style={{ color: C.head }}>Receive a copy</strong> of your data in a portable format</LI>
          <LI><strong style={{ color: C.head }}>Withdraw consent</strong> at any time, without affecting processing that already happened</LI>
        </ul>
        <P>To exercise any of these, email <a href="mailto:privacy@mirec.online" style={{ color: C.gold }}>privacy@mirec.online</a>. We will respond within 30 days. You do not need to give a reason, and exercising these rights is free.</P>
        <P>If you are in the EEA or UK and believe we have handled your data improperly, you also have the right to complain to your local data protection authority.</P>

        <H2>8. Unsubscribing</H2>
        <P>Every email we send contains an unsubscribe link. One click removes you from the list — no login, no confirmation step, no questions. You can also email us and we will remove you manually.</P>

        <H2>9. Cookies</H2>
        <P>We use only what is necessary to make the site work and to collect aggregated analytics. We do not use advertising or cross-site tracking cookies. Where consent is required for non-essential cookies, we ask for it before setting them, and declining does not affect your ability to use the site.</P>

        <H2>10. Children</H2>
        <P>MIREC is not directed at children under 16, and we do not knowingly collect their personal data. If you believe a child has given us their data, contact us and we will delete it.</P>

        <H2>11. Security</H2>
        <P>We use HTTPS across the site, and access to the mailing list is restricted to the people who need it. No system is perfectly secure, but we take reasonable technical and organisational measures to protect your data, and we will notify affected users and regulators of a data breach where the law requires it.</P>

        <H2>12. Changes to this policy</H2>
        <P>If we change this policy in a way that materially affects how we handle your data, we will update the date at the top and, where the change is significant, notify subscribers by email before it takes effect.</P>

        <H2>13. Contact</H2>
        <P>
          <strong style={{ color: C.head }}>Ali Musabeyoğlu</strong><br />
          <Mark>[City]</Mark>, Türkiye<br />
          <a href="mailto:privacy@mirec.online" style={{ color: C.gold }}>privacy@mirec.online</a>
        </P>
      </div>
    </div>
  );
}
