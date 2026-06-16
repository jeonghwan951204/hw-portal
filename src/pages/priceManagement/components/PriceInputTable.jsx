import { CATEGORY_ITEMS } from "../constants";

/** 가격 입력 테이블 */
export default function PriceInputTable({ category, prices, onChange, onSubmit }) {
  const { itemName, items } = CATEGORY_ITEMS[category];

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 섹션 헤더 */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center">
        <h2 className="font-semibold flex items-center gap-2 text-slate-700">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
          {CATEGORY_ITEMS[category].name}
        </h2>
      </div>

      <form onSubmit={onSubmit} className="p-6">
        {/* 테이블: 모바일 대응을 위해 overflow-x-auto 적용 */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm border-collapse min-w-150">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                {/* 구분 열 */}
                <th className="border-r border-slate-200 py-3 px-4 w-24 bg-slate-100/50">
                  구분
                </th>
                {/* 품목명 열 */}
                {itemName.map((name) => (
                  <th key={name} className="border-r border-slate-200 py-3 px-4">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {/* 가격 라벨 셀 */}
                <td className="border-r border-slate-200 py-3 px-4 font-bold text-center bg-slate-50">
                  가격 (₩)
                </td>
                {/* 품목별 입력 셀 */}
                {items.map((item) => (
                  <td key={item} className="border-r border-slate-200 p-0">
                    <input
                      type="number"
                      name={item}
                      placeholder="0"
                      required
                      value={prices[item] ?? ""}
                      onChange={(e) => onChange(item, e.target.value)}
                      className="w-full border-none bg-transparent text-center px-3 py-3 outline-none focus:bg-slate-50 font-mono text-blue-600 font-bold"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 font-medium">
            가장 최신 금액이 입력되어 있습니다.
          </p>
          <button
            type="submit"
            className="w-full md:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {/* 저장 아이콘 */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            저장
          </button>
        </div>
      </form>
    </section>
  );
}
