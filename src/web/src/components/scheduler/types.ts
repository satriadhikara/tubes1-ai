import type { SlotEntry } from "@/components/ui/scheduleTable";

export type BaseRunCommon = {
  alokasi_ruangan_awal: Record<string, SlotEntry[]>;
  alokasi_ruangan: Record<string, SlotEntry[]>;
  search_time: number;
  iteration: number;
};

export type HillClimbingRun = BaseRunCommon & {
  type: "hill";
  objective_over_iteration: number[];
  local_optima_iteration?: number;
  sideways_moves?: number;
  max_sideways?: number;
  restart_count?: number;
  iterations_per_restart?: number[];
};

export type SimulatedAnnealingRun = BaseRunCommon & {
  type: "simulated";
  objective_over_iteration: number[];
  local_optima_stuck_count: number;
  delta_energy_over_iteration: number[];
  temperature_over_iteration: number[];
};

export type GeneticAlgorithmRun = BaseRunCommon & {
  type: "genetic";
  population_size: number;
  objective_best_over_iteration: number[];
  objective_avg_over_iteration: number[];
  params: Record<string, number>;
};

export type SolverRun =
  | HillClimbingRun
  | SimulatedAnnealingRun
  | GeneticAlgorithmRun;

export type HillClimbingResponse = {
  run: Record<string, Omit<HillClimbingRun, "type">>;
};

export type SimulatedAnnealingResponse = {
  run: Record<string, Omit<SimulatedAnnealingRun, "type">>;
};

export type GeneticAlgorithmResponse = {
  run: Record<string, Omit<GeneticAlgorithmRun, "type">>;
};

export type SolverKind = "hill" | "simulated" | "genetic";

export type AlgorithmSelection =
  | {
      kind: "hill";
      variant: "steepest" | "stochastic" | "sideways" | "random_restart";
    }
  | { kind: "simulated" }
  | { kind: "genetic" };
