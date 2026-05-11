import Pagination from "../../../components/Pagination";
import LmeHistoryTable from "./LmeHistoryTable.jsx";

export default function LmeHistorySection({
  history,
  totalPages,
  currentPage,
  tableStartDate,
  tableEndDate,
  tableDateLimits,
  syncing,
  fetchHistory,
  handleSyncCrawling,
  handleResetFilters,
  handleTableDateRangeChange,
  onOpenRateModal,
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div className="flex items-center gap-3 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16M14 4v16" />
          </svg>
          <h2 className="font-bold text-slate-700 text-lg">LME 구리 가격 내역</h2>
          <button
            type="button"
            onClick={handleSyncCrawling}
            disabled={syncing}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 8A8 8 0 006.58 5.08M4 16a8 8 0 0013.42 2.92" />
            </svg>
            {syncing ? "동기화 중" : "동기화"}
          </button>
          <button
            type="button"
            onClick={onOpenRateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            환율 내역
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              시작일
            </label>
            <input
              type="date"
              value={tableStartDate}
              max={tableDateLimits.startMax}
              onChange={(e) => handleTableDateRangeChange("startDate", e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-2 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              종료일
            </label>
            <input
              type="date"
              value={tableEndDate}
              min={tableDateLimits.endMin}
              onChange={(e) => handleTableDateRangeChange("endDate", e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-2 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchHistory(1)}
            className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-lg transition-all shadow-sm active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-slate-400 hover:text-slate-600 underline py-2.5 px-1 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <LmeHistoryTable history={history} />
      </div>

      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => fetchHistory(page)}
      />
    </section>
  );
}
