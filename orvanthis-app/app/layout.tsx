import "./globals.css";
import type { Metadata } from "next";
import AuthSessionProvider from "@/components/session-provider";

export const metadata: Metadata = {
  title: "Orvanthis",
  description: "Strategic intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0a0b0f] text-white antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
