import type { SolverRun } from "./types";
import {
  formatNumber,
  isHillRun,
  isSimulatedRun,
  isGeneticRun,
  finalObjective,
} from "./utils";

interface ResultsTableProps {
  runs: Record<string, SolverRun>;
  selectedRunId: string | null;
  onSelectRun: (id: string) => void;
}

export function ResultsTable({
  runs,
  selectedRunId,
  onSelectRun,
}: ResultsTableProps) {
  const runEntries = Object.entries(runs);

  return (
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
            const isHillRow = isHillRun(run);
            const isSimRow = isSimulatedRun(run);
            const isGenRow = isGeneticRun(run);
            const avgObj = isGenRow
              ? (run.objective_avg_over_iteration.at(-1) ?? null)
              : null;
            const localOptimaIteration = isHillRow
              ? (run.local_optima_iteration ?? run.iteration)
              : run.iteration;
            const sidewaysMoves =
              isHillRow && run.sideways_moves !== undefined
                ? run.sideways_moves
                : "-";
            const restartCount =
              isHillRow && run.restart_count !== undefined
                ? run.restart_count
                : "-";
            const maxSideways =
              isHillRow && run.max_sideways !== undefined
                ? run.max_sideways
                : "-";
            const iterationsPerRestart = isHillRow
              ? run.iterations_per_restart?.length
                ? run.iterations_per_restart.join(", ")
                : "-"
              : "-";
            const stuckCount = isSimRow ? run.local_optima_stuck_count : "-";
            const populationSize = isGenRow ? run.population_size : "-";
            const paramsDisplay = isGenRow
              ? Object.entries(run.params || {})
                  .map(([k, v]) => {
                    const formatted = Number.isInteger(v)
                      ? v.toString()
                      : formatNumber(v, Math.abs(v) < 1 ? 3 : 2);
                    return `${k}=${formatted}`;
                  })
                  .join(", ") || "-"
              : "-";

            return (
              <tr
                key={id}
                onClick={() => onSelectRun(id)}
                className={`border-b border-white/10 last:border-b-0 cursor-pointer hover:bg-white/5 ${
                  selectedRunId === id ? "bg-white/10" : ""
                }`}
              >
                <td className="py-2 pr-4">{`Run ${idx + 1}`}</td>
                <td className="py-2 pr-4">{formatNumber(bestObj, 2)}</td>
                <td className="py-2 pr-4">
                  {avgObj !== null ? formatNumber(avgObj, 2) : "-"}
                </td>
                <td className="py-2 pr-4">
                  {formatNumber(run.search_time, 3)}
                </td>
                <td className="py-2 pr-4">{run.iteration}</td>
                <td className="py-2 pr-4">{localOptimaIteration}</td>
                <td className="py-2 pr-4">{stuckCount}</td>
                <td className="py-2 pr-4">{sidewaysMoves}</td>
                <td className="py-2 pr-4">{restartCount}</td>
                <td className="py-2 pr-4">{maxSideways}</td>
                <td className="py-2 pr-4">{iterationsPerRestart}</td>
                <td className="py-2 pr-4">{populationSize}</td>
                <td className="py-2 pr-4">{paramsDisplay}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
