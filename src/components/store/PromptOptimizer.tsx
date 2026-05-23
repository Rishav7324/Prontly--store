"use client";

import { useState } from "react";
import { Sparkles, Send, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { aiPromptOptimization, type AIPromptOptimizationOutput } from "@/ai/flows/ai-prompt-optimization";

export function PromptOptimizer({ basePrompt }: { basePrompt: string }) {
  const [userQuery, setUserQuery] = useState("");
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIPromptOptimizationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!userQuery) return;
    setIsLoading(true);
    setError(null);
    try {
      const output = await aiPromptOptimization({
        originalPrompt: basePrompt,
        userQuery,
        additionalContext: context,
      });
      setResult(output);
    } catch (err) {
      setError("Failed to optimize prompt. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Testing Scenario</label>
          <Input 
            placeholder="e.g., Generate a blog post about sustainable gardening"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="bg-background"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Extra Constraints (Optional)</label>
          <Textarea 
            placeholder="e.g., Tone should be humorous, mention compost tea"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="bg-background resize-none h-20"
          />
        </div>

        <Button 
          onClick={handleOptimize} 
          disabled={isLoading || !userQuery}
          className="w-full gap-2"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isLoading ? "Optimizing..." : "Analyze & Optimize"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="rounded-lg border bg-background p-4 space-y-3">
              <h4 className="font-semibold text-primary flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Optimized Version
              </h4>
              <div className="rounded bg-muted p-3 font-code text-sm whitespace-pre-wrap">
                {result.optimizedPrompt}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Evaluation</h5>
                <p className="text-sm leading-relaxed">{result.evaluation}</p>
              </div>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Suggestions</h5>
                <p className="text-sm leading-relaxed">{result.suggestions}</p>
              </div>
            </div>

            <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 space-y-2">
              <h4 className="font-semibold text-accent">Sample AI Output</h4>
              <div className="text-sm text-muted-foreground italic">
                "{result.testResponse}"
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
