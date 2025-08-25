import { openai } from "@/lib/openai";
import { splitLines, withRetry } from "@/lib/chunk";
import { AnalyzeResponse } from "@/lib/schema";

export async function POST(req: Request) {
  try {
    const { lyrics } = await req.json();
    if (!lyrics || typeof lyrics !== "string") {
      return new Response(JSON.stringify({ error: "lyrics required" }), { status: 400 });
    }

    const chunks = splitLines(lyrics, 20);
    const perLine: any[] = [];

    // 1) 라인별 분석
    for (let c = 0; c < chunks.length; c++) {
      const enumerated = chunks[c].map((t, i) => `${i + 1}. ${t}`).join("\n");
      const resp = await withRetry(async () =>
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are a Korean lyrics sentiment analyzer. Reply ONLY with JSON." },
            { role: "user", content:
`각 라인에 대해 다음 스키마로만 JSON을 반환:
{"per_line":[{"lineNo":1,"text":"...", "sentiment":"positive|neutral|negative",
"emotions":{"joy":0~1,"anger":0~1,"sadness":0~1,"fear":0~1,"surprise":0~1,"disgust":0~1},
"intensity":0~1}]}

텍스트:
${enumerated}` }
          ],
        })
      );
      const json = JSON.parse(resp.choices[0].message?.content || "{}");
      const arr = (json?.per_line || []).map((it: any) => ({
        ...it,
        lineNo: c * 20 + Number(it.lineNo),
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
          { role: "user", content:
`아래 라인별 결과를 종합해 overall을 산출:
{"overall":{"sentiment":"positive|neutral|negative","emotions":{"joy":0~1,"anger":0~1,"sadness":0~1,"fear":0~1,"surprise":0~1,"disgust":0~1},"toxicity":0~1,"keywords":[{"keyword":"", "score":0~1}]}}
라인별 결과(JSON): ${JSON.stringify(perLine).slice(0, 60000)}`
          }
        ],
      })
    );

    const result = {
      overall: JSON.parse(overallResp.choices[0].message?.content || "{}").overall,
      per_line: perLine,
    };

    const parsed = AnalyzeResponse.parse(result);
    return Response.json(parsed, { status: 200 });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "internal error" }), { status: 500 });
  }
}
