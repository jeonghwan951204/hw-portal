// 현재 페이지 앞뒤로 보여 줄 페이지 번호 개수
const SIBLING_COUNT = 3;

export default function Pagination({ totalPages, currentPage, onPageChange }) {
  if (totalPages <= 1) return null;

  // 첫·끝 페이지와 현재 페이지 앞뒤 SIBLING_COUNT 개를 보여 주고, 사이가 비면 "..." 으로 줄인다.
  // 건너뛰는 페이지가 1개뿐이면 "..." 대신 그 번호를 그대로 보여 준다.
  const getPageNumbers = () => {
    const visible = new Set([1, totalPages]);
    for (let i = currentPage - SIBLING_COUNT; i <= currentPage + SIBLING_COUNT; i++) {
      if (i >= 1 && i <= totalPages) visible.add(i);
    }
    const sorted = [...visible].sort((a, b) => a - b);
    const pages = [];
    sorted.forEach((p, idx) => {
      const prev = sorted[idx - 1];
      if (prev != null && p - prev === 2) pages.push(prev + 1);
      else if (prev != null && p - prev > 2) pages.push("...");
      pages.push(p);
    });
    return pages;
  };

  const btnBase =
    "w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all border border-slate-200";

  return (
    <div className="flex justify-center items-center gap-2 py-4">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {getPageNumbers().map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="text-slate-300">...</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${
              p === currentPage
                ? "bg-blue-600 text-white border-blue-600"
                : "hover:bg-slate-100"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${currentPage === totalPages ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
