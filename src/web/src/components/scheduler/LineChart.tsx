import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "./utils";

interface LineChartProps {
  title: string;
  series: number[];
  color?: string;
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
  indexFormatter?: (index: number) => string;
}

export function LineChart({
  title,
  series,
  color = "#34d399",
  valueLabel = "Nilai",
  valueFormatter,
  indexFormatter,
}: LineChartProps) {
  const data = useMemo(
    () => series.map((value, index) => ({ index, value })),
    [series],
  );

  const hasData = data.length > 0;
  const formatValue =
    valueFormatter ??
    ((value: number) => formatNumber(value, Math.abs(value) < 1 ? 3 : 2));
  const formatIndex = indexFormatter ?? ((index: number) => `Iterasi ${index}`);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={data}
              margin={{ top: 12, right: 20, bottom: 12, left: -10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="index"
                stroke="rgba(255,255,255,0.75)"
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.35)" }}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.75)"
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.35)" }}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                width={80}
                tickFormatter={(value) => formatValue(Number(value))}
                domain={["auto", "auto"]}
              />
              <Tooltip
                cursor={{ stroke: "rgba(52, 211, 153, 0.35)", strokeWidth: 1 }}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.92)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.45)",
                }}
                labelFormatter={(idx) => formatIndex(Number(idx))}
                formatter={(value: number) => [
                  formatValue(value),
                  valueLabel,
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/70">
            Tidak ada data untuk ditampilkan.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
