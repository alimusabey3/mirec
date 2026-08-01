import "./globals.css";
import Consent from "./Consent";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "MIREC — AI Micro-Drama Studio",
  description:
    "Write your story, describe the scene — characters, shots, voiceover and editing come with AI. Everyone has a series.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Oswald:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Consent />
        <Analytics />
      </body>
    </html>
  );
}
