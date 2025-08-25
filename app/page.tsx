"use client";
import { useMemo, useState } from "react";
import type { AnalyzeResponseT, LineRow, Sentiment } from "@/lib/schema";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, ResponsiveContainer
} from "recharts";

/** ───── 유틸 ───── */
function dominantEmotion(emotions: Record<string, number>) {
  return Object.entries(emotions).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? "neutral";
}
function sentimentColor(s: Sentiment) {
  if (s === "positive") return "bg-green-600";
  if (s === "negative") return "bg-red-600";
  return "bg-gray-600";
}
function toCsv(rows: LineRow[]) {
  const head = ["lineNo","sentiment","intensity","text"].join(",");
  const body = rows.map(r =>
    [r.lineNo, r.sentiment, r.intensity, `"${(r.text||"").replace(/"/g,'""')}"`].join(",")
  );
  return [head, ...body].join("\n");
}
function download(name: string, content: string, mime="text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

/** ───── 로딩 UI ───── */
function Spinner() {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-gray-700">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
      </svg>
      분석 중...
    </div>
  );
}

/** 스켈레톤 카드 */
function SkeletonCard({ height = 256 }: { height?: number }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="h-5 w-40 mb-3 skeleton rounded"></div>
      <div className="w-full skeleton rounded" style={{height}} />
    </div>
  );
}

/** ───── 뷰 컴포넌트 ───── */
function Summary({ data }: { data: AnalyzeResponseT }) {
  const dom = dominantEmotion(data.overall.emotions);
  const tox = data.overall.toxicity ?? 0;
  const pos = data.per_line.filter(r=>r.sentiment==="positive").length;
  const neu = data.per_line.filter(r=>r.sentiment==="neutral").length;
  const neg = data.per_line.filter(r=>r.sentiment==="negative").length;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm md:text-base text-center">
      <span className={`inline-flex px-2 py-1 rounded text-white ${sentimentColor(data.overall.sentiment)}`}>
        {data.overall.sentiment.toUpperCase()}
      </span>
      <span>지배 감정: <b>{dom}</b></span>
      <span className="text-gray-600">독성: <b>{Math.round(tox*100)}%</b></span>
      <span className="text-gray-600">비율: +{pos}/{neu}/{neg}</span>
    </div>
  );
}

function KeywordChips({ keywords }: { keywords: {keyword:string; score:number}[] }) {
  const sorted = [...keywords].sort((a,b)=>b.score-a.score);
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {sorted.map(k => (
        <span key={k.keyword} className="px-2 py-1 rounded-full border text-xs sm:text-sm">
          {k.keyword} <span className="opacity-60">({Math.round(k.score*100)})</span>
        </span>
      ))}
    </div>
  );
}

function EmotionBars({ emotions }: { emotions: Record<string, number> }) {
  const data = Object.entries(emotions).map(([k,v])=>({ name: k, value: Math.round(v*100) }));
  return (
    <div className="p-3 sm:p-4 rounded-2xl border text-center">
      <h3 className="font-semibold mb-2 text-sm sm:text-base md:text-lg">감정 분포(%)</h3>
      <div className="h-48 sm:h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function IntensityTimeline({ rows }: { rows: LineRow[] }) {
  const data = rows.map(r => ({ x: r.lineNo, intensity: Math.round(r.intensity*100) }));
  return (
    <div className="p-3 sm:p-4 rounded-2xl border text-center">
      <h3 className="font-semibold mb-2 text-sm sm:text-base md:text-lg">라인별 감정 강도(%)</h3>
      <div className="h-48 sm:h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="intensity" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LineTable({ rows }: { rows: LineRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border text-center">
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-center p-2 w-12 sm:w-16">#</th>
            <th className="text-center p-2 w-24 sm:w-28">Sentiment</th>
            <th className="text-center p-2 w-24 sm:w-28">Intensity</th>
            <th className="text-center p-2">Text</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.lineNo} className="border-t">
              <td className="p-2 text-center">{r.lineNo}</td>
              <td className="p-2 text-center">
                <span className={`px-2 py-0.5 rounded text-white ${sentimentColor(r.sentiment)}`}>
                  {r.sentiment}
                </span>
              </td>
              <td className="p-2 text-center">{Math.round(r.intensity*100)}%</td>
              <td className="p-2 text-left">{r.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** ───── 페이지 ───── */
export default function Page() {
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponseT | null>(null);
  const [, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Sentiment | "all">("all");

  const filtered = useMemo(() => {
    if (!result) return [];
    if (filter === "all") return result.per_line;
    return result.per_line.filter(r => r.sentiment === filter);
  }, [result, filter]);

  async function onAnalyze() {
    setLoading(true); setErr(null); setResult(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ lyrics }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "fail");
      setResult(data);
    } catch(e: unknown){ 
      const errorMessage = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
      setErr(errorMessage); 
    }
    finally { setLoading(false); }
  }

  return (
    <main className="w-full sm:max-w-4xl sm:mx-auto space-y-6">
      <header className="text-center px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">음악 가사 감정 분석기</h1>
        <p className="text-gray-500 text-sm sm:text-base">가사를 붙여넣고 감정을 분석해보세요</p>
      </header>

      <section className="space-y-4 px-4 sm:px-0">
        <textarea
          className="w-[250px] sm:w-full h-48 sm:h-56 lg:h-64 border-[0.5px] border-gray-300 rounded-lg p-4 text-base resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="가사를 붙여넣으세요"
          value={lyrics}
          onChange={e=>setLyrics(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={onAnalyze}
            disabled={loading || !lyrics.trim()}
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-black text-white disabled:opacity-50 flex items-center justify-center gap-2 font-medium hover:bg-gray-800 transition-colors">
            {loading ? <Spinner/> : "분석하기"}
          </button>
          {result && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
                onClick={()=>download("analysis.json", JSON.stringify(result, null, 2), "application/json")}>
                JSON 내보내기
              </button>
              <button
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
                onClick={()=>download("per_line.csv", toCsv(result.per_line), "text/csv")}>
                CSV 내보내기
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 결과 영역 */}
      {loading && (
        <section className="space-y-6">
          <div className="rounded-xl border p-6">
            <div className="h-4 w-48 mb-3 skeleton rounded"></div>
            <div className="flex flex-wrap gap-2">
              <span className="h-6 w-16 skeleton rounded-full"></span>
              <span className="h-6 w-24 skeleton rounded-full"></span>
              <span className="h-6 w-20 skeleton rounded-full"></span>
            </div>
          </div>
          <SkeletonCard />
          <SkeletonCard />
          <div className="rounded-xl border p-6">
            <div className="h-64 skeleton rounded"></div>
          </div>
        </section>
      )}

      {result && !loading && (
        <div className="space-y-6">
          <Summary data={result} />
          <KeywordChips keywords={result.overall.keywords} />

          {/* 그리드: 모바일 1열, md부터 2열 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmotionBars emotions={result.overall.emotions} />
            <IntensityTimeline rows={filtered} />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-sm font-medium">라인 필터:</span>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filter}
              onChange={(e)=>setFilter(e.target.value as Sentiment | "all")}>
              <option value="all">전체</option>
              <option value="positive">긍정</option>
              <option value="neutral">중립</option>
              <option value="negative">부정</option>
            </select>
          </div>

          <LineTable rows={filtered} />
        </div>
      )}
    </main>
  );
}
