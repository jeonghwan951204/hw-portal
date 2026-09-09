// overflow 값에 따른 표시 방식
// - wrap: 셀 폭에 맞춰 줄바꿈 (기본, 상세·모바일)
// - nowrap: 한 줄로 전부 표시하고 컬럼이 값 길이만큼 넓어진다 (자릿수 고정 값)
// - truncate: 한 줄로 표시하고 넘치면 말줄임 (길이가 들쭉날쭉한 값)
const OVERFLOW_CLASS = {
  wrap: { root: "inline-flex items-start", value: "break-all" },
  nowrap: { root: "inline-flex items-center", value: "whitespace-nowrap" },
  truncate: { root: "flex min-w-0 items-center", value: "truncate" },
};

export default function CopyableValue({ label, value, onCopy, mono = true, overflow = "wrap" }) {
  if (!value) return <span className="text-slate-400">-</span>;

  const { root, value: valueClass } = OVERFLOW_CLASS[overflow] ?? OVERFLOW_CLASS.wrap;

  return (
    <button
      type="button"
      onClick={() => onCopy(label, value)}
      // 말줄임 표시일 때는 잘린 값을 확인할 수 있도록 전체 값을 함께 노출한다.
      title={overflow === "truncate" ? `${value} (클릭하여 ${label} 복사)` : `${label} 복사`}
      className={`group max-w-full gap-1.5 text-left text-slate-600 hover:text-blue-600 ${root} ${
        mono ? "font-mono" : ""
      }`}
    >
      <span className={valueClass}>{value}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h7a2 2 0 012 2v9a2 2 0 01-2 2h-2m-7-9H6a2 2 0 00-2 2v9a2 2 0 002 2h7a2 2 0 002-2v-2M8 7h5a2 2 0 012 2v7" />
      </svg>
      <span className="sr-only">{label} 복사</span>
    </button>
  );
}
