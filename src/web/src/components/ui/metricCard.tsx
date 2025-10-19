import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MetricCard({
  title,
  value,
  suffix = "",
}: {
  title: string;
  value: string;
  suffix?: string;
}) {
  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-white">
          {value}
          <span className="text-slate-400 text-lg ml-1">{suffix}</span>
        </div>
      </CardContent>
    </Card>
  );
}
