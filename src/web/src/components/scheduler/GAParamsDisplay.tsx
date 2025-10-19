import type { GeneticAlgorithmRun } from "./types";
import { formatNumber } from "./utils";

interface GAParamsDisplayProps {
  geneticRun: GeneticAlgorithmRun | undefined;
  isGenetic: boolean;
}

export function GAParamsDisplay({
  geneticRun,
  isGenetic,
}: GAParamsDisplayProps) {
  const gaParamEntries = geneticRun
    ? Object.entries(geneticRun.params ?? {})
    : [];
  const hasGAParams = isGenetic && gaParamEntries.length > 0;

  if (!hasGAParams) {
    return null;
  }

  return (
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
  );
}
