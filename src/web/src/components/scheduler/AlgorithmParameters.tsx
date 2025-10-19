import { Label } from "@/components/ui/label";
import type { AlgorithmSelection } from "./types";

const numberInputClass =
  "w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/60";

interface HillParams {
  maxSideways: string;
  maxRestart: string;
  maxIterPerRestart: string;
}

interface SimParams {
  initialTemp: string;
  decay: string;
}

interface GAParams {
  population_size: string;
  max_generations: string;
  crossover_rate: string;
  mutation_rate: string;
  tournament_k: string;
  elitism: string;
}

interface AlgorithmParametersProps {
  selection: AlgorithmSelection | null;
  hillParams: HillParams;
  onHillParamsChange: (params: HillParams) => void;
  simParams: SimParams;
  onSimParamsChange: (params: SimParams) => void;
  gaParams: GAParams;
  onGAParamsChange: (params: GAParams) => void;
}

export function AlgorithmParameters({
  selection,
  hillParams,
  onHillParamsChange,
  simParams,
  onSimParamsChange,
  gaParams,
  onGAParamsChange,
}: AlgorithmParametersProps) {
  if (selection?.kind === "hill") {
    return (
      <div className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-4">
        <p className="text-xs text-white/70">
          Parameter opsional untuk varian hill-climbing.
        </p>
        {selection.variant === "sideways" ? (
          <div className="space-y-1">
            <Label className="text-xs text-white/80">
              Maksimum sideways move
            </Label>
            <input
              type="number"
              min={0}
              value={hillParams.maxSideways}
              onChange={(e) =>
                onHillParamsChange({
                  ...hillParams,
                  maxSideways: e.target.value,
                })
              }
              className={numberInputClass}
              placeholder="default 50"
            />
          </div>
        ) : null}
        {selection.variant === "random_restart" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-white/80">Maksimum restart</Label>
              <input
                type="number"
                min={1}
                value={hillParams.maxRestart}
                onChange={(e) =>
                  onHillParamsChange({
                    ...hillParams,
                    maxRestart: e.target.value,
                  })
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
                  onHillParamsChange({
                    ...hillParams,
                    maxIterPerRestart: e.target.value,
                  })
                }
                className={numberInputClass}
                placeholder="tanpa batas"
              />
            </div>
          </div>
        ) : null}
        {selection.variant === "steepest" ||
        selection.variant === "stochastic" ? (
          <p className="text-[11px] text-white/60">
            Tidak ada parameter tambahan untuk varian ini.
          </p>
        ) : null}
      </div>
    );
  }

  if (selection?.kind === "simulated") {
    return (
      <div className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-4">
        <p className="text-xs text-white/70">
          Atur parameter Simulated Annealing (opsional).
        </p>
        <div className="space-y-1">
          <Label className="text-xs text-white/80">Initial temperature</Label>
          <input
            type="number"
            min={0}
            value={simParams.initialTemp}
            onChange={(e) =>
              onSimParamsChange({
                ...simParams,
                initialTemp: e.target.value,
              })
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
              onSimParamsChange({
                ...simParams,
                decay: e.target.value,
              })
            }
            className={numberInputClass}
            placeholder="default 0.995"
          />
        </div>
      </div>
    );
  }

  if (selection?.kind === "genetic") {
    return (
      <div className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-4">
        <p className="text-xs text-white/70">Parameter Genetic Algorithm.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-white/80">Population size</Label>
            <input
              type="number"
              min={1}
              value={gaParams.population_size}
              onChange={(e) =>
                onGAParamsChange({
                  ...gaParams,
                  population_size: e.target.value,
                })
              }
              className={numberInputClass}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/80">Max generations</Label>
            <input
              type="number"
              min={1}
              value={gaParams.max_generations}
              onChange={(e) =>
                onGAParamsChange({
                  ...gaParams,
                  max_generations: e.target.value,
                })
              }
              className={numberInputClass}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/80">Crossover rate</Label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={gaParams.crossover_rate}
              onChange={(e) =>
                onGAParamsChange({
                  ...gaParams,
                  crossover_rate: e.target.value,
                })
              }
              className={numberInputClass}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/80">Mutation rate</Label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={gaParams.mutation_rate}
              onChange={(e) =>
                onGAParamsChange({
                  ...gaParams,
                  mutation_rate: e.target.value,
                })
              }
              className={numberInputClass}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/80">Tournament k</Label>
            <input
              type="number"
              min={1}
              value={gaParams.tournament_k}
              onChange={(e) =>
                onGAParamsChange({
                  ...gaParams,
                  tournament_k: e.target.value,
                })
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
                onGAParamsChange({
                  ...gaParams,
                  elitism: e.target.value,
                })
              }
              className={numberInputClass}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
