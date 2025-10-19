import MetricCard from "@/components/ui/metricCard";
import type { SolverRun } from "./types";
import {
  formatNumber,
  isHillRun,
  isSimulatedRun,
  isGeneticRun,
  finalObjective,
} from "./utils";

interface MetricsDisplayProps {
  selectedRun: SolverRun | undefined;
  lastVariant: string | null;
  isHill: boolean;
  isSimulated: boolean;
  isGenetic: boolean;
}

export function MetricsDisplay({
  selectedRun,
  lastVariant,
  isHill,
  isSimulated,
  isGenetic,
}: MetricsDisplayProps) {
  const hillRun = isHill && isHillRun(selectedRun) ? selectedRun : undefined;
  const simRun =
    isSimulated && isSimulatedRun(selectedRun) ? selectedRun : undefined;
  const geneticRun =
    isGenetic && isGeneticRun(selectedRun) ? selectedRun : undefined;

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

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard title="Final Objective" value={formatNumber(bestScore, 2)} />
      <MetricCard
        title="Duration"
        value={formatNumber(duration, 3)}
        suffix="s"
      />
      <MetricCard title={iterationTitle} value={String(iterationMetricValue)} />
      <MetricCard
        title={localMetricTitle}
        value={localMetricDisplay}
        suffix={localMetricSuffix}
      />
    </div>
  );
}
