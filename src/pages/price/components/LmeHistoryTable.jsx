import { formatRate, formatUSD } from "../../../utils/format";
import { LIST_FIELDS } from "../constants";

export default function LmeHistoryTable({ history }) {
  if (history.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="font-medium">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed sm:table-auto text-[11px] sm:text-sm border-collapse">
        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
          <tr>
            <th className="w-[26%] sm:w-40 py-3 px-2 sm:px-6 text-left border-r border-slate-200">
              날짜
            </th>
            <th className="w-[27%] py-3 px-2 sm:px-6 text-right border-r border-slate-200">
              <span className="sm:hidden">LME 종가</span>
              <span className="hidden sm:inline">LME 구리 종가 ($/t)</span>
            </th>
            <th className="w-[21%] py-3 px-2 sm:px-6 text-right border-r border-slate-200">
              변동폭
            </th>
            <th className="w-[26%] py-3 px-2 sm:px-6 text-right">
              <span className="sm:hidden">환율</span>
              <span className="hidden sm:inline">환율 (₩/$)</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {history.map((row, idx) => {
            const diff = row.priceChange;
            const isUp = diff !== null && diff > 0;
            const isDown = diff !== null && diff < 0;

            return (
              <tr
                key={row[LIST_FIELDS.id] ?? idx}
                className="hover:bg-slate-50/80 transition-colors animate-fadeIn"
              >
                <td className="py-3 px-2 sm:px-6 border-r border-slate-100 text-slate-500 text-[11px] sm:text-xs font-medium tabular-nums whitespace-nowrap">
                  {row.baseDate}
                </td>
                <td
                  className={`py-3 px-2 sm:px-6 border-r border-slate-100 text-right font-mono font-bold whitespace-nowrap ${
                    isUp ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {formatUSD(row.price)}
                </td>
                <td className="py-3 px-2 sm:px-6 border-r border-slate-100 text-right font-mono whitespace-nowrap">
                  <span className="inline-flex items-center justify-end gap-0.5 sm:gap-1">
                    {isUp && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] sm:text-xs font-bold text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4l8 16H4L12 4z" />
                        </svg>
                        {diff.toFixed(2)}
                      </span>
                    )}
                    {isDown && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] sm:text-xs font-bold text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 20l-8-16h16L12 20z" />
                        </svg>
                        {Math.abs(diff).toFixed(2)}
                      </span>
                    )}
                    {!isUp && !isDown && <span className="text-slate-400">-</span>}
                  </span>
                </td>
                <td className="py-3 px-2 sm:px-6 text-right font-mono text-slate-700 font-semibold whitespace-nowrap">
                  {formatRate(row.rate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
