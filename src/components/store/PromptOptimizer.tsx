"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
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
    </Card>
  );
}
