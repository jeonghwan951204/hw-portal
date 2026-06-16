import { formatKRW } from "../../../utils/format";
import { CATEGORY_ITEMS } from "../constants";

/** 내역 카드 한 건 */
export default function HistoryCard({ record, category }) {
  const { name, mapping } = CATEGORY_ITEMS[category];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all animate-fadeIn">
      {/* 카드 헤더 */}
      <div className="flex justify-between items-start pb-3 border-b border-slate-50">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-blue-600 mb-1">{name}</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {record.createAt}
          </span>
        </div>
        {/* 우측 배지 */}
        <span className="inline-flex gap-1.5 items-center bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full border border-emerald-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {record.createAt}
        </span>
      </div>

      {/* 품목별 가격 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
        {Object.entries(mapping).map(([item, label]) => (
          <div key={item} className="flex flex-col p-2 bg-slate-50/80 rounded-lg border border-slate-100">
            <span className="text-[10px] font-medium text-slate-400 mb-0.5">{label}</span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {formatKRW(record[item] ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
