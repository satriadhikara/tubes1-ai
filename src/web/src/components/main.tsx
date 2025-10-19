import { useEffect, useMemo, useState } from "react";
import Particles from "./ui/particles";
import { InputSection } from "./scheduler/InputSection";
import { AlgorithmSelector } from "./scheduler/AlgorithmSelector";
import { ResultsSection } from "./scheduler/ResultsSection";
import type {
  SolverRun,
  HillClimbingResponse,
  SimulatedAnnealingResponse,
  GeneticAlgorithmResponse,
  SolverKind,
} from "./scheduler/types";
import {
  resolveAlgorithm,
  finalObjective,
  isHillRun,
  isSimulatedRun,
  isGeneticRun,
} from "./scheduler/utils";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

function SchedulerUI() {
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

  async function handleSolve() {
    let parsedInput: unknown;
    try {
      parsedInput = JSON.parse(jsonInput);
    } catch (_) {
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
            { type: "hill", ...run } as any,
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
            { type: "simulated", ...run } as any,
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
            { type: "genetic", ...run } as any,
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
          <InputSection jsonInput={jsonInput} onJsonChange={setJsonInput} />

          <AlgorithmSelector
            algorithm={algorithm}
            onAlgorithmChange={setAlgorithm}
            isLoading={isLoading}
            error={error}
            hillParams={hillParams}
            onHillParamsChange={setHillParams}
            simParams={simParams}
            onSimParamsChange={setSimParams}
            gaParams={gaParams}
            onGAParamsChange={setGaParams}
            onSolve={handleSolve}
            currentSelection={currentSelection}
          />
        </div>
      </section>

      <section className="container mx-auto px-4 mt-10">
        <ResultsSection
          hasResult={hasResult}
          selectedRunId={selectedRunId}
          onSelectRunId={setSelectedRunId}
          runs={runs}
          selectedRun={selectedRun}
          lastVariant={lastVariant}
          isHill={isHill}
          isSimulated={isSimulated}
          isGenetic={isGenetic}
          selectedRoom={selectedRoom}
          onSelectedRoomChange={setSelectedRoom}
          availableRooms={availableRooms}
        />
      </section>

      <footer className="container mx-auto px-4 py-10 text-xs text-muted-foreground text-center">
        <p>Tugas Besar 1 AI</p>
      </footer>
    </div>
  );
}

export default SchedulerUI;
