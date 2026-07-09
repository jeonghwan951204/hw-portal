import { STATUS_FILTERS } from "../constants";

export default function ContractToolbar({
  statusFilter,
  onStatusFilter,
  search,
  onSearch,
  recalculating,
  onRecalculate,
  onCreate,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 상태 필터 */}
      <div className="flex items-center gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatusFilter(s)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
              statusFilter === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative flex-1 min-w-52">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="계약번호 또는 회사명 검색"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
        />
      </div>

      {/* 재계산 */}
      <button
        type="button"
        onClick={onRecalculate}
        disabled={recalculating}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
          recalculating
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {recalculating ? "재계산 중..." : "재계산"}
      </button>

      {/* 계약 등록 */}
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-all shadow-sm shadow-blue-200 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        계약 등록
      </button>
    </div>
  );
}
