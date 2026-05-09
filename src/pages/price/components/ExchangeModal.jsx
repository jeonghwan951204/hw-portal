import Pagination from "../../../components/Pagination";
import { formatRate } from "../../../utils/format";
import { RATE_FIELDS } from "../constants";
import { useExchangeRates } from "../hooks/useExchangeRates";

export default function ExchangeModal({ onClose }) {
  const {
    startDate,
    endDate,
    page,
    rates,
    totalPages,
    totalElements,
    loading,
    errorMessage,
    dateLimits,
    loadRates,
    handleReset,
    handleDateRangeChange,
  } = useExchangeRates();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />
            환율 내역 조회
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-end gap-2 bg-white">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">시작일</label>
            <input
              type="date"
              value={startDate}
              max={dateLimits.startMax}
              onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">종료일</label>
            <input
              type="date"
              value={endDate}
              min={dateLimits.endMin}
              onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all bg-white"
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-600 underline py-1.5 px-1 transition-colors"
            >
              초기화
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400 py-1.5">{totalElements}건</span>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">환율 데이터를 불러오는 중입니다.</div>
          ) : errorMessage ? (
            <div className="py-16 text-center text-red-400 text-sm">{errorMessage}</div>
          ) : rates.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">데이터가 없습니다.</div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-6 text-left border-r border-slate-200">날짜</th>
                  <th className="py-2.5 px-6 text-right border-r border-slate-200">환율 (₩/$)</th>
                  <th className="py-2.5 px-6 text-right">변동폭</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.map((row) => {
                  const diff = row[RATE_FIELDS.exchangeChange];
                  const isUp = diff !== null && diff > 0;
                  const isDown = diff !== null && diff < 0;

                  return (
                    <tr key={row[RATE_FIELDS.baseDate]} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-6 border-r border-slate-100 text-slate-500 text-xs font-medium tabular-nums">
                        {row[RATE_FIELDS.baseDate]}
                      </td>
                      <td className="py-2.5 px-6 text-right font-mono text-slate-700 font-semibold border-r border-slate-100">
                        {formatRate(row[RATE_FIELDS.rate])}
                      </td>
                      <td className="py-2.5 px-6 text-right font-mono">
                        <span className="inline-flex items-center justify-end gap-1">
                          {isUp && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4l8 16H4L12 4z" />
                              </svg>
                              {diff.toFixed(2)}
                            </span>
                          )}
                          {isDown && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 20l-8-16h16L12 20z" />
                              </svg>
                              {Math.abs(diff).toFixed(2)}
                            </span>
                          )}
                          {!isUp && !isDown && <span className="text-slate-400">-</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-slate-100">
          <Pagination totalPages={totalPages} currentPage={page} onPageChange={loadRates} />
        </div>
      </div>
    </div>
  );
}
