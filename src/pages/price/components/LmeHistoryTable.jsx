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
      <table className="w-full text-sm border-collapse">
        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3 px-6 text-left border-r border-slate-200 w-40">
              날짜
            </th>
            <th className="py-3 px-6 text-right border-r border-slate-200">
              LME 구리 종가 ($/t)
            </th>
            <th className="py-3 px-6 text-right border-r border-slate-200">
              변동폭
            </th>
            <th className="py-3 px-6 text-right">
              환율 (₩/$)
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
                <td className="py-3 px-6 border-r border-slate-100 text-slate-500 text-xs font-medium tabular-nums">
                  {row.baseDate}
                </td>
                <td className="py-3 px-6 border-r border-slate-100 text-right font-mono font-bold text-blue-600">
                  {formatUSD(row.price)}
                </td>
                <td className="py-3 px-6 border-r border-slate-100 text-right font-mono">
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
                <td className="py-3 px-6 text-right font-mono text-slate-700 font-semibold">
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
