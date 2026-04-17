import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🎡 최고의 룰렛!!",
  description: "세상에서 제일 못생긴 룰렛",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
