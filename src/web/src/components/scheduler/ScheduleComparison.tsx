import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ScheduleTable from "@/components/ui/scheduleTable";
import type { SlotEntry } from "@/components/ui/scheduleTable";
import type { SolverRun } from "./types";

interface ScheduleComparisonProps {
  selectedRun: SolverRun | undefined;
  selectedRoom: string;
  onSelectedRoomChange: (room: string) => void;
  availableRooms: string[];
}

export function ScheduleComparison({
  selectedRun,
  selectedRoom,
  onSelectedRoomChange,
  availableRooms,
}: ScheduleComparisonProps) {
  const initialSlots: SlotEntry[] =
    selectedRun && selectedRoom
      ? (selectedRun.alokasi_ruangan_awal[selectedRoom] ?? [])
      : [];
  const finalSlots: SlotEntry[] =
    selectedRun && selectedRoom
      ? (selectedRun.alokasi_ruangan[selectedRoom] ?? [])
      : [];

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-white">Pilih Ruangan / Kelas</Label>
          <Select
            value={selectedRoom}
            onValueChange={onSelectedRoomChange}
            disabled={availableRooms.length === 0}
          >
            <SelectTrigger className="w-48 bg-white/10 backdrop-blur-md border-white/20 text-white disabled:opacity-60">
              <SelectValue placeholder="Pilih ruangan" />
            </SelectTrigger>
            <SelectContent>
              {availableRooms.map((room) => (
                <SelectItem key={room} value={room}>
                  {room}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="space-y-6">
        <ScheduleTable
          caption={`State Awal — Ruangan: ${selectedRoom || "-"}`}
          slots={initialSlots}
          emptyMessage="-"
        />
        <ScheduleTable
          caption={`State Akhir — Ruangan: ${selectedRoom || "-"}`}
          slots={finalSlots}
          emptyMessage="-"
        />
      </div>
    </div>
  );
}
