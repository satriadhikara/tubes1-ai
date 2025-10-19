import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LineChartProps {
  title: string;
  series: number[];
}

export function LineChart({ title, series }: LineChartProps) {
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
