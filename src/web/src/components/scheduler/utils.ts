import type {
  SolverRun,
  HillClimbingRun,
  SimulatedAnnealingRun,
  GeneticAlgorithmRun,
  AlgorithmSelection,
} from "./types";

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) {
    return "-";
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(decimals);
}

export function isHillRun(run: SolverRun | undefined): run is HillClimbingRun {
  return Boolean(run && run.type === "hill");
}

export function isSimulatedRun(
  run: SolverRun | undefined,
): run is SimulatedAnnealingRun {
  return Boolean(run && run.type === "simulated");
}

export function isGeneticRun(
  run: SolverRun | undefined,
): run is GeneticAlgorithmRun {
  return Boolean(run && run.type === "genetic");
}

export function finalObjective(run: SolverRun): number {
  if (isGeneticRun(run)) {
    return run.objective_best_over_iteration.at(-1) ?? Infinity;
  }
  if (isSimulatedRun(run) || isHillRun(run)) {
    return run.objective_over_iteration.at(-1) ?? Infinity;
  }
  return Infinity;
}

export function resolveAlgorithm(label: string): AlgorithmSelection | null {
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
