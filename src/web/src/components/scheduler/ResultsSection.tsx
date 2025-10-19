import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { SolverRun } from "./types";
import { formatNumber, finalObjective } from "./utils";
import { MetricsDisplay } from "./MetricsDisplay";
import { ChartsDisplay } from "./ChartsDisplay";
import { ResultsTable } from "./ResultsTable";
import { GAParamsDisplay } from "./GAParamsDisplay";
import { ScheduleComparison } from "./ScheduleComparison";

interface ResultsSectionProps {
  hasResult: boolean;
  selectedRunId: string | null;
  onSelectRunId: (id: string) => void;
  runs: Record<string, SolverRun>;
  selectedRun: SolverRun | undefined;
  lastVariant: string | null;
  isHill: boolean;
  isSimulated: boolean;
  isGenetic: boolean;
  selectedRoom: string;
  onSelectedRoomChange: (room: string) => void;
  availableRooms: string[];
}

export function ResultsSection({
  hasResult,
  selectedRunId,
  onSelectRunId,
  runs,
  selectedRun,
  lastVariant,
  isHill,
  isSimulated,
  isGenetic,
  selectedRoom,
  onSelectedRoomChange,
  availableRooms,
}: ResultsSectionProps) {
  const runEntries = Object.entries(runs);

  if (!hasResult) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white">Result</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-white/80">
            Jalankan solver untuk melihat jadwal dan metrik hasil.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
      <CardHeader>
        <CardTitle className="text-white">Result</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="space-y-1">
            <Label className="text-xs text-white">Pilih Run</Label>
            <Select
              value={selectedRunId ?? ""}
              onValueChange={(value) => onSelectRunId(value)}
            >
              <SelectTrigger className="w-52 bg-white/10 backdrop-blur-md border-white/20 text-white">
                <SelectValue placeholder="Pilih run" />
              </SelectTrigger>
              <SelectContent>
                {runEntries.map(([id, run], idx) => {
                  const bestObj = finalObjective(run);
                  return (
                    <SelectItem key={id} value={id}>
                      {`Run ${idx + 1} — ${formatNumber(bestObj, 2)}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <MetricsDisplay
          selectedRun={selectedRun}
          lastVariant={lastVariant}
          isHill={isHill}
          isSimulated={isSimulated}
          isGenetic={isGenetic}
        />

        <ChartsDisplay
          selectedRun={selectedRun}
          isHill={isHill}
          isSimulated={isSimulated}
          isGenetic={isGenetic}
        />

        <GAParamsDisplay
          geneticRun={
            isGenetic && selectedRun ? (selectedRun as any) : undefined
          }
          isGenetic={isGenetic}
        />

        <ResultsTable
          runs={runs}
          selectedRunId={selectedRunId}
          onSelectRun={onSelectRunId}
        />

        <ScheduleComparison
          selectedRun={selectedRun}
          selectedRoom={selectedRoom}
          onSelectedRoomChange={onSelectedRoomChange}
          availableRooms={availableRooms}
        />
      </CardContent>
    </Card>
  );
}
