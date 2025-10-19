import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Particles from "./ui/particles";
import ScheduleTable, { type SlotEntry } from "@/components/ui/scheduleTable";
import MetricCard from "@/components/ui/metricCard";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

function fmtPct(n: number) {
  if (!Number.isFinite(n)) {
    return "0.00%";
  }
  return `${n.toFixed(2)}%`;
}

function mockSeries(len = 60, seed = 1) {
  let x = seed;
  const arr: number[] = [];
  for (let i = 0; i < len; i++) {
    x = (x * 9301 + 49297) % 233280;
    const v = Math.abs(Math.sin(x / 3000) * 100);
    arr.push(v);
  }
  return arr;
}

function LineChart({ title, series }: { title: string; series: number[] }) {
  const max = Math.max(...series, 1);
  const path = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-56 rounded-md bg-white/5"
        >
          <path d={path} fill="none" stroke="currentColor" strokeWidth={0.8} />
        </svg>
      </CardContent>
    </Card>
  );
}

// --- main page ---
type HillClimbingRun = {
  alokasi_ruangan_awal: Record<string, SlotEntry[]>;
  alokasi_ruangan: Record<string, SlotEntry[]>;
  search_time: number;
  iteration: number;
  objective_over_iteration: number[];
  local_optima_iteration?: number;
  sideways_moves?: number;
  max_sideways?: number;
  restart_count?: number;
  iterations_per_restart?: number[];
};

type HillClimbingResponse = {
  run: Record<string, HillClimbingRun>;
};

export default function SchedulerUI() {
  const [jsonInput, setJsonInput] = useState<string>(
    `{\n  "kelas_mata_kuliah": [],\n  "ruangan": [],\n  "mahasiswa": []\n}`,
  );
  const [algorithm, setAlgorithm] = useState<string>(
    "Steepest Ascent Hill-Climbing",
  );
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("13523601");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<HillClimbingRun | null>(null);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [lastVariant, setLastVariant] = useState<string | null>(null);

  // metrics (mocked)
  const [bestScore, setBestScore] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [localCount, setLocalCount] = useState<number>(0);
  const [localFreq, setLocalFreq] = useState<number>(0);

  const series1 = useMemo(() => mockSeries(60, 2), []);
  const series2 = useMemo(() => mockSeries(60, 9), []);

  useEffect(() => {
    if (availableRooms.length > 0) {
      setSelectedRoom((prev) =>
        prev && availableRooms.includes(prev) ? prev : availableRooms[0],
      );
    }
  }, [availableRooms]);

  function mapAlgorithmToVariant(label: string): string | null {
    switch (label) {
      case "Steepest Ascent Hill-Climbing":
        return "steepest";
      case "Stochastic Hill-Climbing":
        return "stochastic";
      case "Sideways Move Hill-Climbing":
        return "sideways";
      case "Random Restart Hill-Climbing":
        return "random_restart";
      default:
        return null;
    }
  }

  async function handleSolve() {
    let parsedInput: unknown;
    try {
      parsedInput = JSON.parse(jsonInput);
    } catch (e) {
      alert("JSON tidak valid. Periksa kembali formatnya.");
      return;
    }

    const variant = mapAlgorithmToVariant(algorithm);
    if (!variant) {
      alert(
        "Integrasi UI saat ini baru tersedia untuk algoritma hill-climbing.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ variant });
      const response = await fetch(`${API_BASE}/api/hill-climbing?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedInput),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Gagal menjalankan solver");
      }

      const data = (await response.json()) as HillClimbingResponse;
      const runs = Object.values(data.run);
      if (runs.length === 0) {
        throw new Error("Respons solver kosong");
      }

      const bestRun = runs.reduce((best, current) => {
        const bestObj = best.objective_over_iteration.at(-1) ?? Infinity;
        const currentObj = current.objective_over_iteration.at(-1) ?? Infinity;
        return currentObj < bestObj ? current : best;
      });

      const finalObjective = bestRun.objective_over_iteration.at(-1) ?? 0;
      setRunResult(bestRun);
      setBestScore(finalObjective);
      setDuration(bestRun.search_time ?? 0);
      setLocalCount(bestRun.local_optima_iteration ?? bestRun.iteration ?? 0);

      let auxMetric = 0;
      if (variant === "sideways") {
        auxMetric = bestRun.sideways_moves ?? 0;
      } else if (variant === "random_restart") {
        auxMetric = bestRun.restart_count ?? 0;
      }
      setLocalFreq(auxMetric);
      setLastVariant(variant);

      const rooms = new Set<string>();
      Object.keys(bestRun.alokasi_ruangan_awal || {}).forEach((r) =>
        rooms.add(r),
      );
      Object.keys(bestRun.alokasi_ruangan || {}).forEach((r) => rooms.add(r));
      setAvailableRooms(Array.from(rooms).sort());
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan yang tidak diketahui",
      );
      setRunResult(null);
      setAvailableRooms([]);
      setSelectedRoom("");
      setLastVariant(null);
    } finally {
      setIsLoading(false);
    }
  }

  const initialSlots: SlotEntry[] | undefined = runResult
    ? (runResult.alokasi_ruangan_awal[selectedRoom] ?? [])
    : undefined;
  const finalSlots: SlotEntry[] | undefined = runResult
    ? (runResult.alokasi_ruangan[selectedRoom] ?? [])
    : undefined;

  const localFreqDisplay =
    lastVariant === "sideways"
      ? `${localFreq.toFixed(0)}`
      : lastVariant === "random_restart"
        ? `${localFreq.toFixed(0)}`
        : fmtPct(localFreq);
  const localFreqSuffix =
    lastVariant === "sideways"
      ? "moves"
      : lastVariant === "random_restart"
        ? "restarts"
        : "";

  const hasResult = Boolean(runResult);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-emerald-950 via-green-950 to-emerald-950 text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Particles
          className="absolute inset-0 h-full w-full"
          particleColors={["#d1fae5", "#86efac"]}
          particleCount={300}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={200}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute top-40 right-10 h-[420px] w-[420px] rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-[360px] w-[360px] rounded-full bg-lime-400/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-40 right-10 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-80px] h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <header className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 via-mint-200 to-teal-300 drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
            Pencarian Solusi Penjadwalan Kelas Mingguan dengan Local Search
          </h1>
        </div>
      </header>

      <section className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Input JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[320px] font-mono text-sm bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Tempelkan input JSON sesuai spesifikasi..."
              />
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">
                Choose Algorithm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-white">Algorithm</Label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger className="bg-white/10 backdrop-blur-md border-white/20 text-white w-full">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Steepest Ascent Hill-Climbing">
                      Steepest Ascent Hill-Climbing
                    </SelectItem>
                    <SelectItem value="Stochastic Hill-Climbing">
                      Stochastic Hill-Climbing
                    </SelectItem>
                    <SelectItem value="Sideways Move Hill-Climbing">
                      Hill-Climbing with Sideways Move
                    </SelectItem>
                    <SelectItem value="Random Restart Hill-Climbing">
                      Random Restart Hill-Climbing
                    </SelectItem>
                    <SelectItem value="Simulated Annealing">
                      Simulated Annealing
                    </SelectItem>
                    <SelectItem value="Genetic Algorithm">
                      Genetic Algorithm
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white cursor-pointer disabled:opacity-60"
                onClick={handleSolve}
                disabled={isLoading}
              >
                {isLoading ? "Running..." : "Solve"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Tip: gunakan format JSON yang valid.
              </p>
              {error ? <p className="text-xs text-red-200">{error}</p> : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 mt-10">
        {hasResult ? (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Best Score"
                  value={bestScore.toFixed(2)}
                  suffix=""
                />
                <MetricCard
                  title="Duration"
                  value={duration.toFixed(3)}
                  suffix="s"
                />
                <MetricCard
                  title="Local Optima Count"
                  value={String(localCount)}
                />
                <MetricCard
                  title="Local Optima Metric"
                  value={localFreqDisplay}
                  suffix={localFreqSuffix}
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <LineChart
                  title="Plot Objective vs Iterasi (accepted moves)"
                  series={series1}
                />
                <LineChart
                  title="Simulated Annealing: e^-Δ/T vs Iterasi"
                  series={series2}
                />
              </div>

              <div className="mt-8 space-y-6">
                <Tabs defaultValue="ruangan">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <TabsList className="bg-white/10 backdrop-blur-md border border-white/20">
                      <TabsTrigger value="ruangan">Ruangan</TabsTrigger>
                      <TabsTrigger value="mahasiswa">Mahasiswa</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-white">
                          Pilih Ruangan / Kelas
                        </Label>
                        <Select
                          value={selectedRoom}
                          onValueChange={setSelectedRoom}
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

                      <div className="space-y-1">
                        <Label className="text-xs text-white">
                          Pilih Mahasiswa
                        </Label>
                        <Select
                          value={selectedStudent}
                          onValueChange={setSelectedStudent}
                        >
                          <SelectTrigger className="w-48 bg-white/10 backdrop-blur-md border-white/20 text-white">
                            <SelectValue placeholder="Pilih mahasiswa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="13523601">13523601</SelectItem>
                            <SelectItem value="135236641">135236641</SelectItem>
                            <SelectItem value="13523669">13523669</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <TabsContent value="ruangan" className="space-y-6">
                    <ScheduleTable
                      caption={`State Awal — Ruangan: ${selectedRoom || "-"}`}
                      slots={initialSlots}
                    />
                    <ScheduleTable
                      caption={`State Akhir — Ruangan: ${selectedRoom || "-"}`}
                      slots={finalSlots}
                    />
                  </TabsContent>

                  <TabsContent value="mahasiswa" className="space-y-6">
                    <ScheduleTable
                      caption={`State Awal — Mahasiswa: ${selectedStudent}`}
                    />
                    <ScheduleTable
                      caption={`State Akhir — Mahasiswa: ${selectedStudent}`}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </section>

      <footer className="container mx-auto px-4 py-10 text-xs text-muted-foreground text-center">
        <p>Tugas Besar 1 AI</p>
      </footer>
    </div>
  );
}
