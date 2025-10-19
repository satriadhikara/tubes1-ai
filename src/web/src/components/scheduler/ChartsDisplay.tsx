import { LineChart } from "./LineChart";
import type { SolverRun } from "./types";
import { isHillRun, isSimulatedRun, isGeneticRun } from "./utils";

interface ChartsDisplayProps {
  selectedRun: SolverRun | undefined;
  isHill: boolean;
  isSimulated: boolean;
  isGenetic: boolean;
}

export function ChartsDisplay({
  selectedRun,
  isHill,
  isSimulated,
  isGenetic,
}: ChartsDisplayProps) {
  const hillRun = isHill && isHillRun(selectedRun) ? selectedRun : undefined;
  const simRun =
    isSimulated && isSimulatedRun(selectedRun) ? selectedRun : undefined;
  const geneticRun =
    isGenetic && isGeneticRun(selectedRun) ? selectedRun : undefined;

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

  const objectiveChartTitle = isGenetic
    ? "Best Objective vs Generasi"
    : "Objective vs Iterasi";
  const avgChartTitle = "Average Objective vs Generasi";

  return (
    <>
      <div className="mt-6">
        {hasObjectiveSeries ? (
          <LineChart title={objectiveChartTitle} series={objectiveSeries} />
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
            <LineChart title="exp(-Δ/T) vs Iterasi" series={acceptanceSeries} />
          ) : (
            <p className="text-sm text-white/70">
              Tidak ada data exp(-Δ / T) untuk ditampilkan.
            </p>
          )}
        </div>
      ) : null}
    </>
  );
}
