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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Particles from "./ui/particles";
import ScheduleTable, { type SlotEntry } from "@/components/ui/scheduleTable";
import MetricCard from "@/components/ui/metricCard";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) {
    return "-";
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(decimals);
}

const numberInputClass =
  "w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/60";

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
type BaseRunCommon = {
  alokasi_ruangan_awal: Record<string, SlotEntry[]>;
  alokasi_ruangan: Record<string, SlotEntry[]>;
  search_time: number;
  iteration: number;
};

type HillClimbingRun = BaseRunCommon & {
  type: "hill";
  objective_over_iteration: number[];
  local_optima_iteration?: number;
  sideways_moves?: number;
  max_sideways?: number;
  restart_count?: number;
  iterations_per_restart?: number[];
};

type SimulatedAnnealingRun = BaseRunCommon & {
  type: "simulated";
  objective_over_iteration: number[];
  local_optima_stuck_count: number;
  delta_energy_over_iteration: number[];
  temperature_over_iteration: number[];
};

type GeneticAlgorithmRun = BaseRunCommon & {
  type: "genetic";
  population_size: number;
  objective_best_over_iteration: number[];
  objective_avg_over_iteration: number[];
  params: Record<string, number>;
};

type SolverRun = HillClimbingRun | SimulatedAnnealingRun | GeneticAlgorithmRun;

type HillClimbingResponse = {
  run: Record<string, Omit<HillClimbingRun, "type">>;
};

type SimulatedAnnealingResponse = {
  run: Record<string, Omit<SimulatedAnnealingRun, "type">>;
};

type GeneticAlgorithmResponse = {
  run: Record<string, Omit<GeneticAlgorithmRun, "type">>;
};

type SolverKind = "hill" | "simulated" | "genetic";

function isHillRun(run: SolverRun | undefined): run is HillClimbingRun {
  return Boolean(run && run.type === "hill");
}

function isSimulatedRun(
  run: SolverRun | undefined,
): run is SimulatedAnnealingRun {
  return Boolean(run && run.type === "simulated");
}

function isGeneticRun(run: SolverRun | undefined): run is GeneticAlgorithmRun {
  return Boolean(run && run.type === "genetic");
}

function finalObjective(run: SolverRun): number {
  if (isGeneticRun(run)) {
    return run.objective_best_over_iteration.at(-1) ?? Infinity;
  }
  if (isSimulatedRun(run) || isHillRun(run)) {
    return run.objective_over_iteration.at(-1) ?? Infinity;
  }
  return Infinity;
}

export default function SchedulerUI() {
  const [jsonInput, setJsonInput] = useState<string>(
    `{\n  "kelas_mata_kuliah": [],\n  "ruangan": [],\n  "mahasiswa": []\n}`,
  );
  const [algorithm, setAlgorithm] = useState<string>(
    "Steepest Ascent Hill-Climbing",
  );
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [hillParams, setHillParams] = useState({
    maxSideways: "",
    maxRestart: "",
    maxIterPerRestart: "",
  });
  const [simParams, setSimParams] = useState({
    initialTemp: "",
    decay: "",
  });
  const [gaParams, setGaParams] = useState({
    population_size: "50",
    max_generations: "200",
    crossover_rate: "0.9",
    mutation_rate: "0.2",
    tournament_k: "3",
    elitism: "1",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Record<string, SolverRun>>({});
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [lastVariant, setLastVariant] = useState<string | null>(null);
  const [solverKind, setSolverKind] = useState<SolverKind | null>(null);

  const currentSelection = resolveAlgorithm(algorithm);

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
    | {
        kind: "hill";
        variant: "steepest" | "stochastic" | "sideways" | "random_restart";
      }
    | { kind: "simulated" }
    | { kind: "genetic" };

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
      case "Genetic Algorithm":
        return { kind: "genetic" };
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
        "Integrasi UI saat ini hanya tersedia untuk algoritma Hill-Climbing, Simulated Annealing, dan Genetic Algorithm.",
      );
      return;
    }

    const hillQueryValues: Record<string, string> = {};
    const simQueryValues: Record<string, string> = {};
    const gaQueryValues: Record<string, string> = {};

    if (selection.kind === "hill") {
      hillQueryValues.variant = selection.variant;

      if (selection.variant === "sideways") {
        const valueStr = hillParams.maxSideways.trim();
        if (valueStr !== "") {
          const value = Number.parseInt(valueStr, 10);
          if (!Number.isFinite(value) || value < 0) {
            alert("Parameter max sideways harus berupa bilangan bulat >= 0");
            return;
          }
          hillQueryValues.max_sideways = value.toString();
        }
      }

      if (selection.variant === "random_restart") {
        const restartStr = hillParams.maxRestart.trim();
        if (restartStr !== "") {
          const value = Number.parseInt(restartStr, 10);
          if (!Number.isFinite(value) || value < 1) {
            alert("Parameter max restart harus berupa bilangan bulat >= 1");
            return;
          }
          hillQueryValues.max_restart = value.toString();
        }

        const iterStr = hillParams.maxIterPerRestart.trim();
        if (iterStr !== "") {
          const value = Number.parseInt(iterStr, 10);
          if (!Number.isFinite(value) || value < 1) {
            alert(
              "Parameter max iterasi per restart harus berupa bilangan bulat >= 1",
            );
            return;
          }
          hillQueryValues.max_iterations_per_restart = value.toString();
        }
      }
    } else if (selection.kind === "simulated") {
      const tempStr = simParams.initialTemp.trim();
      if (tempStr !== "") {
        const value = Number.parseFloat(tempStr);
        if (!Number.isFinite(value) || value <= 0) {
          alert("Initial temperature harus lebih besar dari 0");
          return;
        }
        simQueryValues.initial_temp = value.toString();
      }

      const decayStr = simParams.decay.trim();
      if (decayStr !== "") {
        const value = Number.parseFloat(decayStr);
        if (!Number.isFinite(value) || value <= 0 || value >= 1) {
          alert("Decay harus berada pada rentang (0, 1)");
          return;
        }
        simQueryValues.decay = value.toString();
      }
    } else if (selection.kind === "genetic") {
      const popStr = gaParams.population_size.trim();
      const genStr = gaParams.max_generations.trim();
      const cxStr = gaParams.crossover_rate.trim();
      const mutStr = gaParams.mutation_rate.trim();
      const tkStr = gaParams.tournament_k.trim();
      const elitStr = gaParams.elitism.trim();

      const popVal = Number.parseInt(popStr, 10);
      if (!Number.isFinite(popVal) || popVal < 1) {
        alert("Population size harus berupa bilangan bulat >= 1");
        return;
      }

      const genVal = Number.parseInt(genStr, 10);
      if (!Number.isFinite(genVal) || genVal < 1) {
        alert("Max generations harus berupa bilangan bulat >= 1");
        return;
      }

      const cxVal = Number.parseFloat(cxStr);
      if (!Number.isFinite(cxVal) || cxVal < 0 || cxVal > 1) {
        alert("Crossover rate harus berada pada rentang [0, 1]");
        return;
      }

      const mutVal = Number.parseFloat(mutStr);
      if (!Number.isFinite(mutVal) || mutVal < 0 || mutVal > 1) {
        alert("Mutation rate harus berada pada rentang [0, 1]");
        return;
      }

      const tkVal = Number.parseInt(tkStr, 10);
      if (!Number.isFinite(tkVal) || tkVal < 1 || tkVal > popVal) {
        alert("Tournament k harus berada pada rentang [1, population size]");
        return;
      }

      let elitVal = Number.parseInt(elitStr, 10);
      if (!Number.isFinite(elitVal) || elitVal < 0) {
        alert("Elitism harus >= 0");
        return;
      }
      if (elitVal >= popVal) {
        elitVal = Math.max(0, popVal - 1);
      }

      gaQueryValues.population_size = popVal.toString();
      gaQueryValues.max_generations = genVal.toString();
      gaQueryValues.crossover_rate = cxVal.toString();
      gaQueryValues.mutation_rate = mutVal.toString();
      gaQueryValues.tournament_k = tkVal.toString();
      gaQueryValues.elitism = elitVal.toString();
    }

    setIsLoading(true);
    setError(null);

    try {
      let runMap: Record<string, SolverRun> = {};

      if (selection.kind === "hill") {
        const params = new URLSearchParams(hillQueryValues);
        const query = params.toString();
        const response = await fetch(`${API_BASE}/api/hill-climbing?${query}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedInput),
        });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || "Gagal menjalankan solver");
        }
        const data = (await response.json()) as HillClimbingResponse;
        runMap = Object.fromEntries(
          Object.entries(data.run || {}).map(([id, run]) => [
            id,
            { type: "hill", ...run } as HillClimbingRun,
          ]),
        );
      } else if (selection.kind === "simulated") {
        const params = new URLSearchParams(simQueryValues);
        const query = params.toString();
        const url = `${API_BASE}/api/sim-anneal${query ? `?${query}` : ""}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedInput),
        });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || "Gagal menjalankan solver");
        }
        const data = (await response.json()) as SimulatedAnnealingResponse;
        runMap = Object.fromEntries(
          Object.entries(data.run || {}).map(([id, run]) => [
            id,
            { type: "simulated", ...run } as SimulatedAnnealingRun,
          ]),
        );
      } else {
        const params = new URLSearchParams(gaQueryValues);
        const query = params.toString();
        const response = await fetch(
          `${API_BASE}/api/genetic-algorithm?${query}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsedInput),
          },
        );
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || "Gagal menjalankan solver");
        }
        const data = (await response.json()) as GeneticAlgorithmResponse;
        runMap = Object.fromEntries(
          Object.entries(data.run || {}).map(([id, run]) => [
            id,
            { type: "genetic", ...run } as GeneticAlgorithmRun,
          ]),
        );
      }
      const entries = Object.entries(runMap);
      if (entries.length === 0) {
        throw new Error("Respons solver kosong");
      }

      const bestEntry = entries.reduce((best, current) => {
        const bestObj = finalObjective(best[1]);
        const currentObj = finalObjective(current[1]);
        return currentObj < bestObj ? current : best;
      });

      setRuns(runMap);
      setSelectedRunId(bestEntry[0]);
      setSolverKind(selection.kind);
      setLastVariant(
        selection.kind === "hill"
          ? selection.variant
          : selection.kind === "simulated"
            ? "simulated"
            : "genetic",
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
    isHillRun(selectedRun) && solverKind === "hill" ? selectedRun : undefined;
  const simRun =
    isSimulatedRun(selectedRun) && solverKind === "simulated"
      ? selectedRun
      : undefined;
  const geneticRun =
    isGeneticRun(selectedRun) && solverKind === "genetic"
      ? selectedRun
      : undefined;
  const isHill = Boolean(hillRun);
  const isSimulated = Boolean(simRun);
  const isGenetic = Boolean(geneticRun);

  const objectiveSeries = hillRun
    ? hillRun.objective_over_iteration
    : simRun
      ? simRun.objective_over_iteration
      : geneticRun
        ? geneticRun.objective_best_over_iteration
        : [];
  const hasObjectiveSeries = objectiveSeries.length > 0;

  const averageSeries = geneticRun?.objective_avg_over_iteration ?? [];
  const hasAverageSeries = isGenetic && averageSeries.length > 0;

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
  const hasTemperatureSeries = isSimulated && temperatureSeries.length > 0;
  const hasAcceptanceSeries = isSimulated && acceptanceSeries.length > 0;

  const bestScore = selectedRun ? finalObjective(selectedRun) : 0;
  const duration = selectedRun?.search_time ?? 0;
  const iterationCount = selectedRun?.iteration ?? 0;
  const localOptIteration = hillRun?.local_optima_iteration ?? iterationCount;
  const iterationMetricValue = isHill ? localOptIteration : iterationCount;
  const iterationTitle = isGenetic ? "Generations" : "Iterations";

  let localMetricTitle = "Total Iterations";
  let localMetricSuffix = "";
  let localMetricValue: number | null = selectedRun?.iteration ?? null;

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
  } else if (geneticRun && isGenetic) {
    localMetricTitle = "Population Size";
    localMetricValue = geneticRun.population_size ?? 0;
  }

  const localMetricDisplay =
    localMetricValue !== null
      ? formatNumber(localMetricValue, Math.abs(localMetricValue) < 1 ? 3 : 2)
      : "-";

  const objectiveChartTitle = isGenetic
    ? "Best Objective vs Generasi"
    : "Objective vs Iterasi";
  const avgChartTitle = "Average Objective vs Generasi";

  const initialSlots: SlotEntry[] =
    selectedRun && selectedRoom
      ? (selectedRun.alokasi_ruangan_awal[selectedRoom] ?? [])
      : [];
  const finalSlots: SlotEntry[] =
    selectedRun && selectedRoom
      ? (selectedRun.alokasi_ruangan[selectedRoom] ?? [])
      : [];

  const gaParamEntries = geneticRun
    ? Object.entries(geneticRun.params ?? {})
    : [];
  const hasGAParams = isGenetic && gaParamEntries.length > 0;

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

              {currentSelection?.kind === "hill" ? (
                <div className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-4">
                  <p className="text-xs text-white/70">
                    Parameter opsional untuk varian hill-climbing.
                  </p>
                  {currentSelection.variant === "sideways" ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-white/80">
                        Maksimum sideways move
                      </Label>
                      <input
                        type="number"
                        min={0}
                        value={hillParams.maxSideways}
                        onChange={(e) =>
                          setHillParams((prev) => ({
                            ...prev,
                            maxSideways: e.target.value,
                          }))
                        }
                        className={numberInputClass}
                        placeholder="default 50"
                      />
                    </div>
                  ) : null}
                  {currentSelection.variant === "random_restart" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-white/80">
                          Maksimum restart
                        </Label>
                        <input
                          type="number"
                          min={1}
                          value={hillParams.maxRestart}
                          onChange={(e) =>
                            setHillParams((prev) => ({
                              ...prev,
                              maxRestart: e.target.value,
                            }))
                          }
                          className={numberInputClass}
                          placeholder="default 10"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-white/80">
                          Maksimum iterasi per restart
                        </Label>
                        <input
                          type="number"
                          min={1}
                          value={hillParams.maxIterPerRestart}
                          onChange={(e) =>
                            setHillParams((prev) => ({
                              ...prev,
                              maxIterPerRestart: e.target.value,
                            }))
                          }
                          className={numberInputClass}
                          placeholder="tanpa batas"
                        />
                      </div>
                    </div>
                  ) : null}
                  {currentSelection.variant === "steepest" ||
                  currentSelection.variant === "stochastic" ? (
                    <p className="text-[11px] text-white/60">
                      Tidak ada parameter tambahan untuk varian ini.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {currentSelection?.kind === "simulated" ? (
                <div className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-4">
                  <p className="text-xs text-white/70">
                    Atur parameter Simulated Annealing (opsional).
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/80">
                      Initial temperature
                    </Label>
                    <input
                      type="number"
                      min={0}
                      value={simParams.initialTemp}
                      onChange={(e) =>
                        setSimParams((prev) => ({
                          ...prev,
                          initialTemp: e.target.value,
                        }))
                      }
                      className={numberInputClass}
                      placeholder="default 100000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/80">Decay</Label>
                    <input
                      type="number"
                      step="0.0001"
                      min={0}
                      max={1}
                      value={simParams.decay}
                      onChange={(e) =>
                        setSimParams((prev) => ({
                          ...prev,
                          decay: e.target.value,
                        }))
                      }
                      className={numberInputClass}
                      placeholder="default 0.995"
                    />
                  </div>
                </div>
              ) : null}

              {currentSelection?.kind === "genetic" ? (
                <div className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-4">
                  <p className="text-xs text-white/70">
                    Parameter Genetic Algorithm.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-white/80">
                        Population size
                      </Label>
                      <input
                        type="number"
                        min={1}
                        value={gaParams.population_size}
                        onChange={(e) =>
                          setGaParams((prev) => ({
                            ...prev,
                            population_size: e.target.value,
                          }))
                        }
                        className={numberInputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-white/80">
                        Max generations
                      </Label>
                      <input
                        type="number"
                        min={1}
                        value={gaParams.max_generations}
                        onChange={(e) =>
                          setGaParams((prev) => ({
                            ...prev,
                            max_generations: e.target.value,
                          }))
                        }
                        className={numberInputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-white/80">
                        Crossover rate
                      </Label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        value={gaParams.crossover_rate}
                        onChange={(e) =>
                          setGaParams((prev) => ({
                            ...prev,
                            crossover_rate: e.target.value,
                          }))
                        }
                        className={numberInputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-white/80">
                        Mutation rate
                      </Label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        value={gaParams.mutation_rate}
                        onChange={(e) =>
                          setGaParams((prev) => ({
                            ...prev,
                            mutation_rate: e.target.value,
                          }))
                        }
                        className={numberInputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-white/80">
                        Tournament k
                      </Label>
                      <input
                        type="number"
                        min={1}
                        value={gaParams.tournament_k}
                        onChange={(e) =>
                          setGaParams((prev) => ({
                            ...prev,
                            tournament_k: e.target.value,
                          }))
                        }
                        className={numberInputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-white/80">Elitism</Label>
                      <input
                        type="number"
                        min={0}
                        value={gaParams.elitism}
                        onChange={(e) =>
                          setGaParams((prev) => ({
                            ...prev,
                            elitism: e.target.value,
                          }))
                        }
                        className={numberInputClass}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

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
                    onValueChange={(value) => setSelectedRunId(value)}
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
                  title={iterationTitle}
                  value={String(iterationMetricValue)}
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
                    title={objectiveChartTitle}
                    series={objectiveSeries}
                  />
                ) : (
                  <p className="text-sm text-white/70">
                    Tidak ada data iterasi untuk ditampilkan.
                  </p>
                )}
              </div>

              {isGenetic && hasAverageSeries ? (
                <div className="mt-6">
                  <LineChart title={avgChartTitle} series={averageSeries} />
                </div>
              ) : null}

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
                      Tidak ada data e^{-Δ / T} untuk ditampilkan.
                    </p>
                  )}
                </div>
              ) : null}

              {hasGAParams ? (
                <div className="mt-6 text-sm text-white/80 flex flex-wrap gap-3">
                  {gaParamEntries.map(([key, value]) => {
                    const formattedValue = Number.isInteger(value)
                      ? value.toString()
                      : formatNumber(value, Math.abs(value) < 1 ? 3 : 2);
                    return (
                      <span
                        key={key}
                        className="rounded-full bg-white/10 px-3 py-1 border border-white/10"
                      >
                        {`${key}: ${formattedValue}`}
                      </span>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm text-white/90 min-w-[950px]">
                  <thead>
                    <tr className="text-left border-b border-white/10">
                      <th className="py-2 pr-4">Run</th>
                      <th className="py-2 pr-4">Best Objective</th>
                      <th className="py-2 pr-4">Avg Objective</th>
                      <th className="py-2 pr-4">Duration (s)</th>
                      <th className="py-2 pr-4">Iterations</th>
                      <th className="py-2 pr-4">Local Optima Iter</th>
                      <th className="py-2 pr-4">Stuck Count</th>
                      <th className="py-2 pr-4">Sideways Moves</th>
                      <th className="py-2 pr-4">Restarts</th>
                      <th className="py-2 pr-4">Max Sideways</th>
                      <th className="py-2 pr-4">Iter per Restart</th>
                      <th className="py-2 pr-4">Population</th>
                      <th className="py-2 pr-4">Params</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runEntries.map(([id, run], idx) => {
                      const bestObj = finalObjective(run);
                      const avgObj = isGeneticRun(run)
                        ? (run.objective_avg_over_iteration.at(-1) ?? null)
                        : null;
                      return (
                        <tr
                          key={id}
                          className={`border-b border-white/10 last:border-b-0 ${
                            selectedRunId === id ? "bg-white/10" : ""
                          }`}
                        >
                          <td className="py-2 pr-4">{`Run ${idx + 1}`}</td>
                          <td className="py-2 pr-4">
                            {formatNumber(bestObj, 2)}
                          </td>
                          <td className="py-2 pr-4">
                            {avgObj !== null ? formatNumber(avgObj, 2) : "-"}
                          </td>
                          <td className="py-2 pr-4">
                            {formatNumber(run.search_time, 3)}
                          </td>
                          <td className="py-2 pr-4">{run.iteration}</td>
                          <td className="py-2 pr-4">
                            {run.local_optima_iteration ?? run.iteration}
                          </td>
                          <td className="py-2 pr-4">
                            {isSimulatedRun(run)
                              ? run.local_optima_stuck_count
                              : "-"}
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
                          <td className="py-2 pr-4">
                            {isGeneticRun(run) ? run.population_size : "-"}
                          </td>
                          <td className="py-2 pr-4">
                            {isGeneticRun(run)
                              ? Object.entries(run.params || {})
                                  .map(([k, v]) => {
                                    const formatted = Number.isInteger(v)
                                      ? v.toString()
                                      : formatNumber(
                                          v,
                                          Math.abs(v) < 1 ? 3 : 2,
                                        );
                                    return `${k}=${formatted}`;
                                  })
                                  .join(", ") || "-"
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
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
