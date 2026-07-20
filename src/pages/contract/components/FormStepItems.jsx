import { Fragment } from "react";
import NumericInput from "./NumericInput";

const INPUT_CLASS =
  "w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";

// 스텝 3 — 품목 (테이블 · 행 추가)
// 요율 컬럼은 스텝 2에서 추가한 단가 수만큼 동적 생성.
export default function FormStepItems({
  items,
  prices,
  primaryItemId,
  onAdd,
  onRemove,
  onItemChange,
  onRateChange,
  onPremiumChange,
  onTogglePremium,
  onSetPrimary,
  priceTypeLabel = (v) => v,
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs">
                <th className="px-4 py-2.5 text-center font-semibold whitespace-nowrap">대표</th>
                <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">품목명</th>
                {prices.map((price, idx) => (
                  <th key={price.tempId} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                    {priceTypeLabel(price.priceType) || `단가 ${idx + 1}`} 요율(%)
                  </th>
                ))}
                <th className="px-4 py-2.5 whitespace-nowrap" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={prices.length + 3} className="px-4 py-10 text-center text-slate-400">
                    추가된 품목이 없습니다.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <Fragment key={item.tempId}>
                  <tr>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name="primary-item"
                        checked={primaryItemId === item.tempId}
                        onChange={() => onSetPrimary(item.tempId)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 min-w-36">
                      <input
                        type="text"
                        placeholder="품목명"
                        value={item.name}
                        onChange={(e) => onItemChange(item.tempId, "name", e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </td>
                    {prices.map((price) => (
                      <td key={price.tempId} className="px-4 py-3 min-w-28">
                        <NumericInput
                          placeholder="요율"
                          value={item.rates[price.tempId] ?? ""}
                          onChange={(value) => onRateChange(item.tempId, price.tempId, value)}
                          className={INPUT_CLASS}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => onTogglePremium(item.tempId)}
                        className={`text-xs font-semibold mr-3 transition-colors ${
                          item.premiumOpen
                            ? "text-blue-600 hover:text-blue-700"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {item.premiumOpen ? "−프리미엄" : "+프리미엄"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item.tempId)}
                        className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>

                  {/* 프리미엄 펼침 행 — 펼치지 않으면 프리미엄 값 없음 */}
                  {item.premiumOpen && (
                    <tr className="bg-slate-50/60">
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-xs font-bold text-slate-400 whitespace-nowrap">
                        프리미엄
                      </td>
                      {prices.map((price) => (
                        <td key={price.tempId} className="px-4 py-3">
                          <NumericInput
                            placeholder="프리미엄"
                            value={item.premiums[price.tempId] ?? ""}
                            onChange={(value) => onPremiumChange(item.tempId, price.tempId, value)}
                            className={INPUT_CLASS}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3" />
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {prices.length === 0 && (
        <p className="text-xs text-amber-500 px-1">
          스텝 2에서 단가를 추가하면 품목별 요율 입력 칸이 생성됩니다.
        </p>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="w-full py-3 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-all"
      >
        + 품목 추가
      </button>
    </div>
  );
}
