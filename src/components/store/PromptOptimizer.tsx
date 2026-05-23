"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { aiPromptOptimization, type AIPromptOptimizationOutput } from "@/ai/flows/ai-prompt-optimization";
import { Sparkles, Loader2, Play, Code2, CheckCircle2, History } from "lucide-react";
import { cn } from "@/lib/utils";

export function PromptOptimizer({ basePrompt }: { basePrompt: string }) {
  const [userQuery, setUserQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIPromptOptimizationOutput | null>(null);

  const handleOptimize = async () => {
    if (!userQuery) return;
    setIsLoading(true);
    try {
      const output = await aiPromptOptimization({
        originalPrompt: basePrompt,
        userQuery,
      });
      setResult(output);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 rounded-3xl overflow-hidden shadow-xl">
      <CardContent className="p-8 pt-10 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Play className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-bold font-headline">Live Prompt Tester</h3>
            <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary border-none">AI Optimized</Badge>
          </div>
          
          <div className="relative group">
            <Textarea 
              placeholder="Describe a scenario to test this prompt (e.g. Write a landing page for a coffee subscription)..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="min-h-[120px] bg-background/50 border-white/5 rounded-2xl focus:ring-primary focus:border-primary text-lg resize-none p-6"
            />
            <Button 
              onClick={handleOptimize}
              disabled={isLoading || !userQuery}
              className="absolute bottom-4 right-4 h-12 px-6 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Run Test
            </Button>
          </div>
        </div>

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <Code2 className="h-3 w-3" /> Optimized Logic
              </div>
              <div className="p-6 rounded-2xl bg-black/40 border border-white/5 font-mono text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {result.optimizedPrompt}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <History className="h-3 w-3" /> Test Output
              </div>
              <div className="p-6 rounded-2xl bg-primary/10 border border-primary/10 text-sm leading-relaxed text-foreground/90 italic">
                {result.testResponse}
              </div>
            </div>
          </div>
        )}

        {!result && !isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
            <p className="text-sm text-muted-foreground max-w-xs">Enter a testing scenario above to see how this prompt performs in the real world.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}