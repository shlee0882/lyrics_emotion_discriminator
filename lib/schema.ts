import { z } from "zod";

export const LineResult = z.object({
  lineNo: z.number().int().positive(),
  text: z.string(),
  sentiment: z.enum(["positive","neutral","negative"]),
  emotions: z.record(z.number().min(0).max(1)),
  intensity: z.number().min(0).max(1),
});
export const PerLine = z.array(LineResult);

export const Overall = z.object({
  sentiment: z.enum(["positive","neutral","negative"]),
  emotions: z.record(z.number().min(0).max(1)),
  toxicity: z.number().min(0).max(1).optional(),
  keywords: z.array(z.object({ keyword: z.string(), score: z.number() })).default([]),
});

export const AnalyzeResponse = z.object({
  overall: Overall,
  per_line: PerLine,
});

export type AnalyzeResponseT = z.infer<typeof AnalyzeResponse>;
export type Sentiment = z.infer<typeof Overall>["sentiment"];
export type LineRow = z.infer<typeof LineResult>;
