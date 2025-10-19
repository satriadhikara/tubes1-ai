import CodeEditor from "@uiw/react-textarea-code-editor";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <CardContent className="max-h-96 overflow-y-auto">
        <CodeEditor
          value={jsonInput}
          language="json"
          placeholder="Tempelkan input JSON sesuai spesifikasi..."
          onChange={(event) => onJsonChange(event.target.value)}
          padding={16}
          className="min-h-[320px] rounded-md border border-white/20 font-mono leading-relaxed text-white bg-black/20"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.35)",
            fontSize: 14,
            color: "white",
            fontFamily: "Menlo, Monaco, 'Courier New', monospace",
          }}
        />
      </CardContent>
    </Card>
  );
}
