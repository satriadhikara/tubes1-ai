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

function formatNumber(value: number, decimals = 2): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : "-";
}

function LineChart({ title, series }: { title: string; series: number[] }) {
  const data = series.length >= 2 ? series : [...series, ...series];
  const max = Math.max(...data, 1);
  const path = data
    .map((v, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 0;
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

// --- types ---
type BaseRun = {
  alokasi_ruangan_awal: Record<string, SlotEntry[]>;
  alokasi_ruangan: Record<string, SlotEntry[]>;
  search_time: number;
  iteration: number;
  objective_over_iteration: number[];
};

type HillClimbingRun = BaseRun & {
  local_optima_iteration?: number;
  sideways_moves?: number;
  max_sideways?: number;
  restart_count?: number;
  iterations_per_restart?: number[];
};

type SimulatedAnnealingRun = BaseRun & {
  local_optima_stuck_count: number;
  delta_energy_over_iteration: number[];
  temperature_over_iteration: number[];
};

type SolverRun = HillClimbingRun | SimulatedAnnealingRun;

type HillClimbingResponse = {
  run: Record<string, HillClimbingRun>;
};

type SimulatedAnnealingResponse = {
  run: Record<string, SimulatedAnnealingRun>;
};

type SolverKind = "hill" | "simulated";

function isSimulatedRun(run: SolverRun | undefined): run is SimulatedAnnealingRun {
  return Boolean(run && "local_optima_stuck_count" in run);
}

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
  const [runs, setRuns] = useState<Record<string, SolverRun>>({});
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [lastVariant, setLastVariant] = useState<string | null>(null);
  const [solverKind, setSolverKind] = useState<SolverKind | null>(null);

  const runEntries = useMemo(() => Object.entries(runs), [runs]);

  useEffect(() => {
    if (runEntries.length === 0) {
      setSelectedRunId(null);
      return;
    }
    if (!selectedRunId || !runs[selectedRunId]) {
      setSelectedRunId(runEntries[0][0]);
    }
  }, [runEntries, selectedRunId, runs]);

  useEffect(() => {
    if (selectedRunId) {
      const run = runs[selectedRunId];
      if (run) {
        const rooms = new Set<string>();
        Object.keys(run.alokasi_ruangan_awal || {}).forEach((r) =>
          rooms.add(r),
        );
        Object.keys(run.alokasi_ruangan || {}).forEach((r) => rooms.add(r));
        setAvailableRooms(Array.from(rooms).sort());
        return;
      }
    }
    setAvailableRooms([]);
  }, [selectedRunId, runs]);

  useEffect(() => {
    if (availableRooms.length > 0) {
      setSelectedRoom((prev) =>
        prev && availableRooms.includes(prev) ? prev : availableRooms[0],
      );
    } else {
      setSelectedRoom("");
    }
  }, [availableRooms]);

  type AlgorithmSelection =
    | { kind: "hill"; variant: "steepest" | "stochastic" | "sideways" | "random_restart" }
    | { kind: "simulated" };

  function resolveAlgorithm(label: string): AlgorithmSelection | null {
    switch (label) {
      case "Steepest Ascent Hill-Climbing":
        return { kind: "hill", variant: "steepest" };
      case "Stochastic Hill-Climbing":
        return { kind: "hill", variant: "stochastic" };
      case "Sideways Move Hill-Climbing":
        return { kind: "hill", variant: "sideways" };
      case "Random Restart Hill-Climbing":
        return { kind: "hill", variant: "random_restart" };
      case "Simulated Annealing":
        return { kind: "simulated" };
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

    const selection = resolveAlgorithm(algorithm);
    if (!selection) {
      alert(
        "Integrasi UI saat ini hanya tersedia untuk algoritma Hill-Climbing dan Simulated Annealing.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response: Response;
      if (selection.kind === "hill") {
        const params = new URLSearchParams({ variant: selection.variant });
        response = await fetch(`${API_BASE}/api/hill-climbing?${params}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedInput),
        });
      } else {
        response = await fetch(`${API_BASE}/api/sim-anneal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedInput),
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Gagal menjalankan solver");
      }

      const data = (await response.json()) as
        | HillClimbingResponse
        | SimulatedAnnealingResponse;
      const runMap = (data.run ?? {}) as Record<string, SolverRun>;
      const entries = Object.entries(runMap);
      if (entries.length === 0) {
        throw new Error("Respons solver kosong");
      }

      const bestEntry = entries.reduce((best, current) => {
        const bestObj = best[1].objective_over_iteration.at(-1) ?? Infinity;
        const currentObj = current[1].objective_over_iteration.at(-1) ?? Infinity;
        return currentObj < bestObj ? current : best;
      });

      setRuns(runMap);
      setSelectedRunId(bestEntry[0]);
      setSolverKind(selection.kind);
      setLastVariant(
        selection.kind === "hill" ? selection.variant : "simulated",
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan yang tidak diketahui",
      );
      setRuns({});
      setSelectedRunId(null);
      setAvailableRooms([]);
      setSelectedRoom("");
      setSolverKind(null);
      setLastVariant(null);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedRun = selectedRunId ? runs[selectedRunId] : undefined;
  const hillRun =
    selectedRun && !isSimulatedRun(selectedRun)
      ? (selectedRun as HillClimbingRun)
      : undefined;
  const simRun = isSimulatedRun(selectedRun)
    ? (selectedRun as SimulatedAnnealingRun)
    : undefined;
  const isSimulated = Boolean(simRun && solverKind === "simulated");
  const isHill = Boolean(hillRun && solverKind === "hill");

  const bestScore = selectedRun
    ? selectedRun.objective_over_iteration.at(-1) ?? 0
    : 0;
  const duration = selectedRun?.search_time ?? 0;
  const localOptIteration = selectedRun
    ? hillRun?.local_optima_iteration ?? selectedRun.iteration ?? 0
    : 0;

  let localMetricTitle = "Total Iterations";
  let localMetricSuffix = "";
  let localMetricValue: number | null = null;
  if (hillRun && isHill) {
    if (lastVariant === "sideways") {
      localMetricTitle = "Sideways Moves";
      localMetricSuffix = "moves";
      localMetricValue = hillRun.sideways_moves ?? 0;
    } else if (lastVariant === "random_restart") {
      localMetricTitle = "Restart Count";
      localMetricSuffix = "restarts";
      localMetricValue = hillRun.restart_count ?? 0;
    } else {
      localMetricTitle = "Total Iterations";
      localMetricValue = hillRun.iteration ?? 0;
    }
  } else if (simRun && isSimulated) {
    localMetricTitle = "Stuck Count";
    localMetricValue = simRun.local_optima_stuck_count ?? 0;
  }
  const localMetricDisplay =
    localMetricValue !== null
      ? Number.isInteger(localMetricValue)
        ? String(localMetricValue)
        : formatNumber(localMetricValue)
      : "-";

  const objectiveSeries = selectedRun?.objective_over_iteration ?? [];
  const hasObjectiveSeries = objectiveSeries.length > 0;

  const temperatureSeries = simRun?.temperature_over_iteration ?? [];
  const deltaSeries = simRun?.delta_energy_over_iteration ?? [];
  const acceptanceSeries = simRun
    ? deltaSeries.map((delta, idx) => {
        const temp = temperatureSeries[idx] ?? 1;
        if (temp <= 0) return 0;
        if (delta <= 0) return 1;
        return Math.exp(-delta / temp);
      })
    : [];
  const hasTemperatureSeries = temperatureSeries.length > 0;
  const hasAcceptanceSeries = acceptanceSeries.length > 0;

  const initialSlots: SlotEntry[] =
    selectedRun && selectedRoom
      ? selectedRun.alokasi_ruangan_awal[selectedRoom] ?? []
      : [];
  const finalSlots: SlotEntry[] =
    selectedRun && selectedRoom
      ? selectedRun.alokasi_ruangan[selectedRoom] ?? []
      : [];

  const hasResult = Boolean(selectedRun);

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
              <div className="flex flex-wrap items-end gap-4 mb-6">
                <div className="space-y-1">
                  <Label className="text-xs text-white">Pilih Run</Label>
                  <Select
                    value={selectedRunId ?? ""}
                    onValueChange={(value) => setSelectedRunId(value || null)}
                  >
                    <SelectTrigger className="w-52 bg-white/10 backdrop-blur-md border-white/20 text-white">
                      <SelectValue placeholder="Pilih run" />
                    </SelectTrigger>
                    <SelectContent>
                      {runEntries.map(([id, run], idx) => {
                        const finalObj = run.objective_over_iteration.at(-1) ?? 0;
                        return (
                          <SelectItem key={id} value={id}>
                            {`Run ${idx + 1} — ${formatNumber(finalObj, 2)}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Final Objective"
                  value={formatNumber(bestScore, 2)}
                />
                <MetricCard
                  title="Duration"
                  value={formatNumber(duration, 3)}
                  suffix="s"
                />
                <MetricCard
                  title="Local Optima Iteration"
                  value={String(localOptIteration)}
                />
                <MetricCard
                  title={localMetricTitle}
                  value={localMetricDisplay}
                  suffix={localMetricSuffix}
                />
              </div>

              <div className="mt-6">
                {hasObjectiveSeries ? (
                  <LineChart
                    title="Objective vs Iterasi"
                    series={objectiveSeries}
                  />
                ) : (
                  <p className="text-sm text-white/70">
                    Tidak ada data iterasi untuk ditampilkan.
                  </p>
                )}
              </div>

              {isSimulated ? (
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {hasTemperatureSeries ? (
                    <LineChart
                      title="Temperatur vs Iterasi"
                      series={temperatureSeries}
                    />
                  ) : (
                    <p className="text-sm text-white/70">
                      Tidak ada data temperatur untuk ditampilkan.
                    </p>
                  )}
                  {hasAcceptanceSeries ? (
                    <LineChart
                      title="e^{-Δ/T} vs Iterasi"
                      series={acceptanceSeries}
                    />
                  ) : (
                    <p className="text-sm text-white/70">
                      Tidak ada data e^{-Δ/T} untuk ditampilkan.
                    </p>
                  )}
                </div>
              ) : null}

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm text-white/90 min-w-[680px]">
                  <thead>
                    <tr className="text-left border-b border-white/10">
                      <th className="py-2 pr-4">Run</th>
                      <th className="py-2 pr-4">Final Objective</th>
                      <th className="py-2 pr-4">Duration (s)</th>
                      <th className="py-2 pr-4">Iterations</th>
                      <th className="py-2 pr-4">Local Optima Iter</th>
                      <th className="py-2 pr-4">Stuck Count</th>
                      <th className="py-2 pr-4">Sideways Moves</th>
                      <th className="py-2 pr-4">Restarts</th>
                      <th className="py-2 pr-4">Max Sideways</th>
                      <th className="py-2 pr-4">Iter per Restart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runEntries.map(([id, run], idx) => {
                      const finalObj = run.objective_over_iteration.at(-1) ?? 0;
                      return (
                        <tr
                          key={id}
                          className={`border-b border-white/10 last:border-b-0 ${
                            selectedRunId === id ? "bg-white/10" : ""
                          }`}
                        >
                          <td className="py-2 pr-4">{`Run ${idx + 1}`}</td>
                          <td className="py-2 pr-4">{formatNumber(finalObj, 2)}</td>
                          <td className="py-2 pr-4">{formatNumber(run.search_time, 3)}</td>
                          <td className="py-2 pr-4">{run.iteration}</td>
                          <td className="py-2 pr-4">
                            {run.local_optima_iteration ?? run.iteration}
                          </td>
                          <td className="py-2 pr-4">
                            {isSimulatedRun(run) ? run.local_optima_stuck_count : "-"}
                          </td>
                          <td className="py-2 pr-4">
                            {run.sideways_moves ?? "-"}
                          </td>
                          <td className="py-2 pr-4">
                            {run.restart_count ?? "-"}
                          </td>
                          <td className="py-2 pr-4">
                            {run.max_sideways ?? "-"}
                          </td>
                          <td className="py-2 pr-4">
                            {run.iterations_per_restart?.length
                              ? run.iterations_per_restart.join(", ")
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                      emptyMessage="-"
                    />
                    <ScheduleTable
                      caption={`State Akhir — Ruangan: ${selectedRoom || "-"}`}
                      slots={finalSlots}
                      emptyMessage="-"
                    />
                  </TabsContent>

                  <TabsContent value="mahasiswa" className="space-y-6">
                    <ScheduleTable
                      caption={`State Awal — Mahasiswa: ${selectedStudent}`}
                      emptyMessage="-"
                    />
                    <ScheduleTable
                      caption={`State Akhir — Mahasiswa: ${selectedStudent}`}
                      emptyMessage="-"
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
