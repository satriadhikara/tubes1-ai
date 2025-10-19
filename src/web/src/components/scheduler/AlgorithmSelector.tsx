import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlgorithmParameters } from "./AlgorithmParameters";
import type { AlgorithmSelection } from "./types";

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

interface AlgorithmSelectorProps {
  algorithm: string;
  onAlgorithmChange: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  hillParams: HillParams;
  onHillParamsChange: (params: HillParams) => void;
  simParams: SimParams;
  onSimParamsChange: (params: SimParams) => void;
  gaParams: GAParams;
  onGAParamsChange: (params: GAParams) => void;
  onSolve: () => void;
  currentSelection: AlgorithmSelection | null;
}

export function AlgorithmSelector({
  algorithm,
  onAlgorithmChange,
  isLoading,
  error,
  hillParams,
  onHillParamsChange,
  simParams,
  onSimParamsChange,
  gaParams,
  onGAParamsChange,
  onSolve,
  currentSelection,
}: AlgorithmSelectorProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white">Choose Algorithm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm text-white">Algorithm</Label>
          <Select value={algorithm} onValueChange={onAlgorithmChange}>
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

        <AlgorithmParameters
          selection={currentSelection}
          hillParams={hillParams}
          onHillParamsChange={onHillParamsChange}
          simParams={simParams}
          onSimParamsChange={onSimParamsChange}
          gaParams={gaParams}
          onGAParamsChange={onGAParamsChange}
        />

        <Button
          className="w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white cursor-pointer disabled:opacity-60"
          onClick={onSolve}
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
  );
}
