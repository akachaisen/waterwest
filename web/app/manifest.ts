import type { MetadataRoute } from "next";

// ให้เพิ่มเว็บลงหน้าจอหลักมือถือได้ (เปิดเต็มจอเหมือนแอป)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WaterWest ลุ่มน้ำแม่กลอง",
    short_name: "WaterWest",
    description: "ติดตามระดับน้ำและแจ้งเตือนน้ำท่วม ลุ่มน้ำแม่กลอง",
    lang: "th",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f9",
    theme_color: "#0b6aa8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
