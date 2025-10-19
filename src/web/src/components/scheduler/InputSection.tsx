import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface InputSectionProps {
  jsonInput: string;
  onJsonChange: (value: string) => void;
}

export function InputSection({ jsonInput, onJsonChange }: InputSectionProps) {
  return (
    <Card className="lg:col-span-2 bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white">Input JSON</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          className="min-h-[320px] font-mono text-sm bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white"
          value={jsonInput}
          onChange={(e) => onJsonChange(e.target.value)}
          placeholder="Tempelkan input JSON sesuai spesifikasi..."
        />
      </CardContent>
    </Card>
  );
}
