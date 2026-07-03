import "./globals.css";

export const metadata = {
  title: "MIREC — Yapay Zekâ Mikro-Dizi Stüdyosu",
  description:
    "Senaryonu yaz, sahneyi tarif et — karakterler, çekimler, seslendirme ve kurgu yapay zekâyla gelsin. Herkesin bir dizisi var.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Oswald:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
