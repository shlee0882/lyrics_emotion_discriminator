# 🎶 음악 가사 감정 분석기

가사를 붙여넣으면 AI(OpenAI GPT API)를 통해 **라인별 감정 분석**과 **전체 분위기 요약**을 제공하는 웹 애플리케이션입니다.  
모바일 웹에서도 최적화되어 있으며, 감정 분포 차트/라인 강도 그래프/키워드 추출 기능을 제공합니다.

---

## 🚀 배포 링크
👉 [Live Demo](https://lyrics-emotion-discriminator-kp7w.vercel.app/)

---

## ✨ 주요 기능
- 📌 가사 입력 후 **AI 감정 분석** (positive / neutral / negative)
- 🎭 라인별 감정 강도(Intensity) 시각화
- 📊 전체 감정 분포 차트(joy, sadness, anger, fear, surprise, disgust)
- 🔑 주요 키워드 추출
- 💾 JSON/CSV 다운로드
- 📱 **모바일 반응형 UI**

---

## 🛠 기술 스택
- **Frontend/Fullstack**
  - Next.js 14 (App Router)
  - React 18
  - Tailwind CSS
  - Recharts (데이터 시각화)
- **Backend**
  - OpenAI GPT-4o-mini API (감정 분석/텍스트 처리)
- **Deploy**
  - Vercel (서버리스 배포)

---

## 📂 프로젝트 구조
```bash
.
├── app
│   ├── api
│   │   └── analyze
│   │       └── route.ts   # API 라우트 (OpenAI 호출)
│   ├── page.tsx           # 메인 페이지
│   ├── layout.tsx         # 기본 레이아웃
│   └── globals.css        # 전역 스타일
├── lib
│   ├── openai.ts          # OpenAI 클라이언트
│   ├── chunk.ts           # 유틸 (라인 청크 분리 등)
│   └── schema.ts          # Zod 스키마 정의
├── public                 # 정적 파일
├── package.json
├── tailwind.config.js
└── README.md
```

## 설치 & 실행 방법
```bash
git clone https://github.com/your-username/lyrics-sentiment-analyzer.git
cd lyrics-sentiment-analyzer
```

### 의존성 설치
```bash
npm install
```

### 환경 변수 설정
```bash
OPENAI_API_KEY=sk-xxxxxx
```

### 로컬 실행
```bash
npm run dev
```

### 배포
```bash
vercel
```