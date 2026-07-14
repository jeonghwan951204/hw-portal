import { MOCK_FORMULAS, PRICE_TYPE_STYLE, formatDate, formatQuantity, ownerLabel } from "../constants";

const formulaName = (formulaId) =>
  MOCK_FORMULAS.find((f) => f.id === formulaId)?.name ?? formulaId;

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 text-xs font-bold text-slate-400">{label}</span>
      <span className="text-slate-700 font-medium">{value || "-"}</span>
    </div>
  );
}

// 스텝 4 — 입력 요약 확인
export default function FormStepConfirm({ basic, prices, items, primaryItemId }) {
  return (
    <div className="space-y-4">
      {/* 기본 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-2.5">
        <h3 className="text-sm font-bold text-slate-700 mb-3">계약 기본</h3>
        <SummaryRow label="계약명" value={basic.name} />
        <SummaryRow label="소속회사" value={ownerLabel(basic.ownerCompany)} />
        {basic.contractNo && <SummaryRow label="계약번호" value={basic.contractNo} />}
        <SummaryRow label="거래처" value={basic.customer} />
        <SummaryRow
          label="계약기간"
          value={
            basic.startDate || basic.endDate
              ? `${formatDate(basic.startDate)} – ${formatDate(basic.endDate)}`
              : ""
          }
        />
        <SummaryRow label="거래구분" value={basic.tradeType} />
        <SummaryRow label="단가 단위" value={basic.priceUnit} />
        {basic.quantity !== "" && (
          <SummaryRow label="계약 수량" value={formatQuantity(basic)} />
        )}
        {basic.memo && <SummaryRow label="비고" value={basic.memo} />}
      </div>

      {/* 단가 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3">단가 ({prices.length}건)</h3>
        {prices.length === 0 ? (
          <p className="text-sm text-slate-400">추가된 단가가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {prices.map((price) => (
              <div key={price.tempId} className="flex flex-wrap items-center gap-2.5 text-sm">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${PRICE_TYPE_STYLE[price.type] ?? PRICE_TYPE_STYLE["원가"]}`}>
                  {price.type}
                </span>
                <span className="text-slate-600">
                  {formatDate(price.periodStart)} – {formatDate(price.periodEnd)}
                </span>
                <span className="text-xs text-slate-400">
                  {formulaName(price.formulaId)}
                  {price.formulaId === "FIXED" && price.fixedPrice !== "" && ` · ${price.fixedPrice}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 품목 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3">품목 ({items.length}건)</h3>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">추가된 품목이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.tempId} className="flex flex-wrap items-center gap-2.5 text-sm">
                <span className="font-semibold text-slate-700">{item.name || "(품목명 미입력)"}</span>
                {primaryItemId === item.tempId && (
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                    대표
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {prices
                    .map((price) => {
                      const rate = item.rates[price.tempId];
                      const premium = item.premiums[price.tempId];
                      if (rate == null || rate === "") return null;
                      return `${price.type} ${rate}%${premium != null && premium !== "" ? ` (+${premium})` : ""}`;
                    })
                    .filter(Boolean)
                    .join(" · ") || "요율 미입력"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
