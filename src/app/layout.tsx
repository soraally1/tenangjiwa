import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Tenang Jiwa - Mental Health Support",
  description: "Platform dukungan kesehatan mental untuk membantu mengenali dan mengelola perasaan jiwa",
  icons: {
    icon: [
      {
        url: '/TenangJiwa.svg',
        type: 'image/svg+xml',
      }
    ],
    shortcut: '/TenangJiwa.svg',
    apple: '/TenangJiwa.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${jakartaSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
