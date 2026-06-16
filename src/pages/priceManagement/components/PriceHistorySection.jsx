import Pagination from "../../../components/Pagination";
import HistoryCard from "./HistoryCard";

/** 최근 내역 섹션 (필터 + 카드 목록 + 페이지네이션) */
export default function PriceHistorySection({
  category,
  history,
  totalPages,
  currentPage,
  startDate,
  endDate,
  dateLimits,
  fetchHistory,
  handleResetFilters,
  handleDateRangeChange,
}) {
  return (
    <section className="space-y-4">
      {/* 섹션 헤더 + 필터 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div className="flex items-center gap-2 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="font-bold text-slate-700 text-lg">최근 내역</h2>
        </div>

        {/* 날짜 필터 */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              시작일
            </label>
            <input
              type="date"
              value={startDate}
              max={dateLimits.startMax}
              onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-2 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              종료일
            </label>
            <input
              type="date"
              value={endDate}
              min={dateLimits.endMin}
              onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-2 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white"
            />
          </div>
          {/* 검색 버튼 */}
          <button
            type="button"
            onClick={() => fetchHistory(1)}
            className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-lg transition-all shadow-sm active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          {/* 초기화 버튼 */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-slate-400 hover:text-slate-600 underline py-2.5 px-1 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 내역 카드 목록 */}
      <div className="space-y-4">
        {history.length === 0 ? (
          // 내역 없을 때 빈 상태 UI
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 flex flex-col items-center justify-center text-slate-400 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium">내역이 없습니다.</p>
          </div>
        ) : (
          history.map((record, idx) => (
            <HistoryCard key={record.id ?? idx} record={record} category={category} />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => fetchHistory(page)}
      />
    </section>
  );
}
