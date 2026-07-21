import { formatDate, formatNumber } from "../constants";

function MetricCard({ label, value, detail, valueClass = "text-slate-800" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold font-mono ${valueClass}`}>{value}</p>
      {detail && <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p>}
    </div>
  );
}

export default function TransactionStatistics({ data, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-8 text-center text-sm text-slate-400">
        거래 통계를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600 shadow-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const isUsd = data.settlementCurrency === "USD";
  const moneyDigits = isUsd ? 2 : 0;
  const moneyUnit = isUsd ? "USD" : "원";
  const priceUnit = data.priceUnit === "TON" ? "ton" : "kg";
  const progress = Math.min(100, Math.max(0, Number(data.deliveryProgressRate) || 0));
  const remainingQuantity = Number(data.remainingContractQuantityKg) || 0;
  const remainingQuantityLabel =
    remainingQuantity < 0
      ? `+${formatNumber(Math.abs(remainingQuantity))} kg`
      : `${formatNumber(remainingQuantity)} kg`;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-700">거래 현황</h4>
        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={`font-bold px-2 py-0.5 rounded-full border ${
              data.allItemsFinalSettlementCompleted
                ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                : "text-slate-500 bg-white border-slate-200"
            }`}
          >
            {data.allItemsFinalSettlementCompleted ? "전체 정산 완료" : "정산 진행 중"}
          </span>
          <span className="text-slate-400">
            {data.firstTransactionDate
              ? `${formatDate(data.firstTransactionDate)} – ${formatDate(data.latestTransactionDate)}`
              : "거래 기간 없음"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-bold text-slate-400">납품률</p>
          <p className="mt-1 text-lg font-bold font-mono text-blue-600">
            {formatNumber(data.deliveryProgressRate, 1)}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {formatNumber(data.totalQuantityKg)} / {formatNumber(data.contractQuantityKg)} kg
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <MetricCard
          label="거래 건수"
          value={`${formatNumber(data.transactionCount)}건`}
          detail={`결제 ${formatNumber(data.paidTransactionCount)} · 미결제 ${formatNumber(data.unpaidTransactionCount)}`}
        />
        <MetricCard
          label="가중평균 단가"
          value={formatNumber(data.weightedAverageUnitPrice, moneyDigits)}
          detail={`${moneyUnit}/${priceUnit}`}
        />
        <MetricCard
          label="잔여 계약수량"
          value={remainingQuantityLabel}
          valueClass={remainingQuantity < 0 ? "text-rose-600" : "text-slate-800"}
          detail={`계약 ${formatNumber(data.contractQuantityKg)} kg · 납품 ${formatNumber(data.totalQuantityKg)} kg`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs">
        <div>
          <p className="text-slate-400">총 정산금액</p>
          <p className="mt-1 font-mono font-bold text-slate-700">
            {formatNumber(data.totalSettlementAmount, moneyDigits)} {moneyUnit}
          </p>
        </div>
        <div>
          <p className="text-slate-400">총 결제금액</p>
          <p className="mt-1 font-mono font-bold text-emerald-600">
            {formatNumber(data.totalPaidAmount, moneyDigits)} {moneyUnit}
          </p>
        </div>
        <div>
          <p className="text-slate-400">마지막 정산</p>
          <p className="mt-1 font-semibold text-slate-700">
            {data.hasFinalSettlement
              ? `${formatNumber(data.finalSettlementItemCount)}개 품목 완료`
              : "미완료"}
          </p>
          {isUsd && data.totalPaidKrw != null && (
            <p className="mt-0.5 text-[11px] text-slate-400">
              원화 입금 {formatNumber(data.totalPaidKrw)}원
            </p>
          )}
        </div>
      </div>

      {(data.items ?? []).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400">
                <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">품목</th>
                <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">건수</th>
                <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">수량(kg)</th>
                <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">평균 단가</th>
                <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">정산금액</th>
                <th className="px-4 py-2.5 text-center font-semibold whitespace-nowrap">마지막 정산</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((item) => (
                <tr key={item.itemId}>
                  <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{item.itemName}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatNumber(item.transactionCount)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatNumber(item.totalQuantityKg)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatNumber(item.weightedAverageUnitPrice, moneyDigits)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">{formatNumber(item.totalSettlementAmount, moneyDigits)}</td>
                  <td className="px-4 py-2.5 text-center">{item.finalSettlementCompleted ? "완료" : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
