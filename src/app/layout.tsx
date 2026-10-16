import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MQH-Chat — دردشة أقرب إلك",
  description: "مساحة دردشة خاصة وبسيطة، مع دعوات وأكواد انضمام.",
  applicationName: "MQH-Chat"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" suppressHydrationWarning><body>{children}</body></html>;
}