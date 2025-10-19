import { useMemo } from "react";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;
const HOURS = Array.from({ length: 11 }, (_, i) => 7 + i); // 7..17

export type SlotEntry = {
  kode_kelas_kuliah: string;
  hari: string;
  waktu_mulai: number;
  waktu_akhir: number;
};

export default function ScheduleTable({
  caption,
  slots,
  emptyMessage,
}: {
  caption: string;
  slots?: SlotEntry[];
  emptyMessage?: string;
}) {
  const cellMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!slots) return map;
    for (const slot of slots) {
      for (let jam = slot.waktu_mulai; jam < slot.waktu_akhir; jam++) {
        const key = `${slot.hari}-${jam}`;
        const existing = map.get(key);
        if (existing) {
          if (!existing.includes(slot.kode_kelas_kuliah)) {
            existing.push(slot.kode_kelas_kuliah);
          }
        } else {
          map.set(key, [slot.kode_kelas_kuliah]);
        }
      }
    }
    return map;
  }, [slots]);

  return (
    <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-xl shadow-xl">
      <div className="px-4 py-3 text-sm font-medium border-b text-white">
        {caption}
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-muted/40 text-left">
              <th className="px-3 py-2 font-medium sticky left-0 bg-muted/40">
                Jam
              </th>
              {DAYS.map((d) => (
                <th key={d} className="px-3 py-2 font-medium">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h) => (
              <tr key={h} className="border-t">
                <td className="px-3 py-2 sticky left-0 bg-background/70 font-medium">
                  {h}
                </td>
                {DAYS.map((d) => (
                  <td key={d} className="h-12 px-3 py-2 align-top">
                    <div className="whitespace-pre-line text-xs text-white/80">
                      {cellMap.get(`${d}-${h}`)?.join("\n") ??
                        emptyMessage ??
                        ""}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
