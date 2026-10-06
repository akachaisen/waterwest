import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { NavLinks } from "@/components/NavLinks";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const thai = IBM_Plex_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "WaterWest — ติดตามลุ่มน้ำแม่กลอง", template: "%s · WaterWest" },
  description: "สถานการณ์น้ำในลุ่มน้ำแม่กลอง ตั้งแต่เขื่อนวชิราลงกรณ ศรีนครินทร์ เขื่อนแม่กลอง ราชบุรี ถึงปากอ่าวสมุทรสงคราม",
  // ลิงก์รูปตัวอย่าง (opengraph-image.png) ต้องเป็น URL เต็ม เวลาแชร์ใน LINE/Facebook
  metadataBase: new URL("https://waterwest.info"),
  openGraph: {
    title: "WaterWest ลุ่มน้ำแม่กลอง",
    description: "ติดตามระดับน้ำและแจ้งเตือนน้ำท่วม จากเขื่อนวชิราลงกรณ และเขื่อนศรีนครินทร์ ถึงอ่าวไทย · อัปเดตทุก 15 นาที",
    siteName: "WaterWest",
    locale: "th_TH",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { title: "WaterWest", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  viewportFit: "cover", // ให้เมนูล่างเว้นขอบจอ iPhone (safe-area)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a111c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${thai.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-2.5">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-accent text-white dark:text-bg" aria-hidden>
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
                  <path d="M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
                  <path d="M12 3v7m0 0-3-3m3 3 3-3" />
                </svg>
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold">WaterWest</span>
                <span className="hidden text-[0.7rem] text-muted sm:block">ติดตามลุ่มน้ำแม่กลอง</span>
              </span>
            </Link>
            {/* จอใหญ่: เมนูด้านบน · มือถือ: เมนูด้านล่าง (BottomNav) */}
            <div className="hidden sm:block">
              <NavLinks />
            </div>
            <a href="tel:1784" className="rounded-full border border-red/40 px-3 py-1 text-sm font-bold text-red sm:hidden">
              โทร 1784
            </a>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">{children}</main>

        <footer className="border-t border-border bg-surface pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
          <div className="mx-auto max-w-5xl space-y-1.5 px-4 py-5 text-xs text-muted">
            <p>
              ข้อมูลจาก กรมชลประทาน (SWOC, อ่างเก็บน้ำ) · คลังข้อมูลน้ำแห่งชาติ (สสน.) · กฟผ. · ปภ. (สถานีและกล้องริมน้ำ) · Open-Meteo — แต่ละค่าแสดงเวลาวัดของตัวเอง
            </p>
            <p className="font-medium">
              เว็บนี้ใช้ประกอบการติดตามสถานการณ์ ไม่ใช่ประกาศทางการ โปรดปฏิบัติตามคำแนะนำของ ปภ. และจังหวัด · สายด่วน ปภ. 1784
            </p>
          </div>
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
