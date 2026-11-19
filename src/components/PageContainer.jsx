// 페이지 본문 공통 래퍼 — 폭·여백·섹션 간격을 화면 간에 맞춘다.
// expanded: 넓은 표, wide: 목록·조회 화면, form: 등록·수정 폼, narrow: 단계형 폼처럼 좁은 화면
const WIDTHS = {
  expanded: "max-w-[1800px]",
  wide: "max-w-[100rem]",
  form: "max-w-6xl",
  narrow: "max-w-4xl",
};

export default function PageContainer({ width = "wide", className = "", children }) {
  return <main className={`mx-auto w-full ${WIDTHS[width]} space-y-5 px-4 py-6 md:px-6 ${className}`}>{children}</main>;
}
