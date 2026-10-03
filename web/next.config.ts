import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // โฟลเดอร์หลัก (repo) มี package-lock ของสคริปต์ดึงข้อมูลด้วย จึงระบุว่าเว็บอยู่ที่ web/
  turbopack: { root: process.cwd() },
};

export default nextConfig;
