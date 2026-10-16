import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MQH-Chat — محادثاتك في مكان واحد",
  description: "تطبيق مراسلة خاص وسريع، مع محادثات ودعوات وأكواد انضمام.",
  applicationName: "MQH-Chat"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" suppressHydrationWarning><body>{children}</body></html>;
}