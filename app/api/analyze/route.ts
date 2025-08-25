import { openai } from "@/lib/openai";
import { splitLines, withRetry } from "@/lib/chunk";
import { AnalyzeResponse, PerLine, LineResult, Overall } from "@/lib/schema";
import { z } from "zod";

type LineRow = z.infer<typeof LineResult>;
type OverallT = z.infer<typeof Overall>;

export async function POST(req: Request) {
  try {
    const { lyrics } = (await req.json()) as { lyrics?: string };
    if (!lyrics || typeof lyrics !== "string") {
      return new Response(JSON.stringify({ error: "lyrics required" }), { status: 400 });
    }

    const chunks = splitLines(lyrics, 20);
    const perLine: LineRow[] = [];

    // 1) 라인별 분석
    for (let c = 0; c < chunks.length; c++) {
      const enumerated = chunks[c].map((t, i) => `${i + 1}. ${t}`).join("\n");

      const resp = await withRetry(async () =>
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are a Korean lyrics sentiment analyzer. Reply ONLY with JSON." },
            {
              role: "user",
              content: `각 라인에 대해 다음 스키마로만 JSON을 반환:
{"per_line":[{"lineNo":1,"text":"...", "sentiment":"positive|neutral|negative",
"emotions":{"joy":0~1,"anger":0~1,"sadness":0~1,"fear":0~1,"surprise":0~1,"disgust":0~1},
"intensity":0~1}]}

텍스트:
${enumerated}`,
            },
          ],
        })
      );

      const raw = resp.choices[0]?.message?.content ?? "{}";
      const json = JSON.parse(raw) as { per_line?: unknown };

      // Zod로 per_line 검증
      const chunkParsed = PerLine.safeParse(json.per_line);
      if (!chunkParsed.success) {
        // 청크 하나 실패해도 전체를 막지 않고 스킵
        continue;
      }

      const arr: LineRow[] = chunkParsed.data.map((it) => ({
        ...it,
        lineNo: c * 20 + it.lineNo,
      }));

      perLine.push(...arr);
    }

    // 2) 전체 요약
    const overallResp = await withRetry(async () =>
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Summarize Korean lyrics sentiment. Reply ONLY with JSON." },
          {
            role: "user",
            content: `아래 라인별 결과를 종합해 overall을 산출:
{"overall":{"sentiment":"positive|neutral|negative","emotions":{"joy":0~1,"anger":0~1,"sadness":0~1,"fear":0~1,"surprise":0~1,"disgust":0~1},"toxicity":0~1,"keywords":[{"keyword":"", "score":0~1}]}}
라인별 결과(JSON): ${JSON.stringify(perLine).slice(0, 60000)}`,
          },
        ],
      })
    );

    const overallRaw = overallResp.choices[0]?.message?.content ?? "{}";
    const overallJson = JSON.parse(overallRaw) as { overall?: unknown };

    // overall만 따로 검증
    const overallParsed = Overall.safeParse(overallJson.overall);
    if (!overallParsed.success) {
      return new Response(JSON.stringify({ error: "overall parse failed" }), { status: 500 });
    }

    const result = {
      overall: overallParsed.data as OverallT,
      per_line: perLine,
    };

    // 최종 스키마 검증
    const parsed = AnalyzeResponse.parse(result);
    return Response.json(parsed, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg || "internal error" }), { status: 500 });
  }
}
