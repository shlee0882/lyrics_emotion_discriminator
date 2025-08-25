import "./globals.css";

export const metadata = {
  title: "음악 가사 감정 분석기",
  description: "가사 붙여넣기 → 감정 분석 → 시각화",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-black antialiased">
        {/* PC와 모바일 모두에서 중앙 정렬을 위한 flex 컨테이너 */}
        <div className="min-h-screen flex justify-center">
          {/* 왼쪽 여백 - PC에서만 보임 */}
          <div className="hidden lg:block lg:flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
          
          {/* 중앙 컨텐츠 영역 - 고정 최대 너비로 상단 정렬 */}
          <div className="w-full max-w-6xl lg:max-w-4xl xl:max-w-5xl bg-white flex flex-col justify-start px-0 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            {children}
          </div>
          
          {/* 오른쪽 여백 - PC에서만 보임 */}
          <div className="hidden lg:block lg:flex-1 bg-gradient-to-bl from-purple-50 via-indigo-50 to-blue-50"></div>
        </div>
      </body>
    </html>
  );
}
