"use client";

import { useState } from "react";

// ปุ่มดาวน์โหลดรายงานเป็นรูป (ให้เบราว์เซอร์วาดภาษาไทยเอง จึงวางสระ/วรรณยุกต์ถูกต้อง) และพิมพ์/บันทึก PDF
export function ReportToolbar({ targetId, fileName }: { targetId: string; fileName: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const download = async () => {
    const node = document.getElementById(targetId);
    if (!node) return;
    setBusy(true);
    setErr(null);
    try {
      // สร้าง SVG (ฝังฟอนต์ไทย) แล้ววาดลง canvas เอง — toPng/toCanvas ของไลบรารีค้างในบางเบราว์เซอร์
      const { toSvg } = await import("html-to-image");
      await document.fonts.ready;
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const svg = await toSvg(node, { width: w, height: h, style: { margin: "0", boxShadow: "none" } });
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load"));
        img.src = svg;
      });
      const ratio = 2;
      const canvas = document.createElement("canvas");
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
    } catch {
      setErr("สร้างรูปไม่สำเร็จ ลองใหม่อีกครั้ง หรือใช้ปุ่มพิมพ์/บันทึก PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="print:hidden flex flex-wrap items-center gap-2">
      <button type="button" onClick={download} disabled={busy} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:text-bg">
        {busy ? "กำลังสร้างรูป…" : "⬇️ ดาวน์โหลดเป็นรูป (PNG)"}
      </button>
      <button type="button" onClick={() => window.print()} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-accent">
        🖨️ พิมพ์ / บันทึก PDF
      </button>
      {err && <span className="text-sm text-red" role="alert">{err}</span>}
    </div>
  );
}
