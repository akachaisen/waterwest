"use client";

import { useEffect, useState } from "react";
import type { Camera } from "@/lib/places";

// ภาพนิ่งจากกล้อง กฟผ. — โหลดใหม่ทุก 1 นาที (ภาพมีเวลาประทับในตัว)
export function CameraGrid({ cameras }: { cameras: Camera[] }) {
  const [tick, setTick] = useState(() => Math.floor(Date.now() / 60000));
  useEffect(() => {
    const id = setInterval(() => setTick(Math.floor(Date.now() / 60000)), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cameras.map((c) => {
        const src = `${c.src}?t=${tick}`;
        return (
          <figure key={c.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <a href={src} target="_blank" rel="noopener noreferrer" title="เปิดภาพเต็ม">
              {/* eslint-disable-next-line @next/next/no-img-element -- ภาพสดจากกล้อง กฟผ. */}
              <img src={src} alt={`ภาพจากกล้อง ${c.name}`} className="aspect-video w-full bg-surface-2 object-cover" loading="lazy" />
            </a>
            <figcaption className="px-3 py-2">
              <span className="block text-sm font-semibold">{c.name}</span>
              {c.note && <span className="block text-xs text-muted">{c.note}</span>}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
