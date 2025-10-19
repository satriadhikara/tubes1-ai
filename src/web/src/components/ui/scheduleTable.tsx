import React from "react";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;
const HOURS = Array.from({ length: 11 }, (_, i) => 7 + i); // 7..17

export default function ScheduleTable({ caption }: { caption: string }) {
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
                    {/* cells intentionally empty; fill from backend later */}
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
