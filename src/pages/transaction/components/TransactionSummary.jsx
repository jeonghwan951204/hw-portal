import { AMOUNT_STATUS_LABELS, formatMoney, formatWeight, labelOf } from "../constants";

function SummaryItem({ label, value, note }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className="mt-0.5 truncate font-mono text-sm font-semibold text-slate-800">{value}</p>
      {note && <p className="text-[10px] text-amber-600">{note}</p>}
    </div>
  );
}

// 계산되지 않은 금액(단가 미입력)이 있으면 서버 합계는 null 이다.
const amountOrMissing = (value, currency) => (value == null ? "-" : formatMoney(value, currency));

export function SummaryGrid({ summary }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
      <SummaryItem label="차량" value={summary.vehicles.length ? `${summary.vehicles.length}대` : "-"} note={summary.vehicles.join(", ") || null} />
      <SummaryItem label="품목 수 · 건수" value={`${summary.itemCount}종 · ${summary.rowCount}건`} />
      <SummaryItem label="총 실중량" value={formatWeight(summary.totalWeightKg)} />
      <SummaryItem label="인수량" value={formatWeight(summary.acceptedWeightKg)} note={summary.acceptedMissing ? "미입력 행 제외" : null} />
      <SummaryItem label="감량" value={formatWeight(summary.deductionWeightKg)} note={summary.deductionMissing ? "미입력 행 제외" : null} />
      <SummaryItem label="예상금액" value={amountOrMissing(summary.estimatedAmount, summary.currency)} note={summary.estimatedAmount == null ? "미계산 금액 포함" : null} />
      <SummaryItem label="실제금액" value={amountOrMissing(summary.actualAmount, summary.currency)} />
      <SummaryItem
        label={`최종 표시금액 (${labelOf(AMOUNT_STATUS_LABELS, summary.amountStatus)})`}
        value={amountOrMissing(summary.displayAmount, summary.currency)}
        note={summary.displayAmount == null ? "미계산 금액 포함" : null}
      />
    </div>
  );
}

const WARNING_TONES = {
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
};

export function WarningList({ warnings }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {warnings.map((warning) => (
        <li key={warning.text} className={`rounded-lg px-3 py-2 text-sm ${WARNING_TONES[warning.tone] ?? WARNING_TONES.amber}`}>
          {warning.text}
        </li>
      ))}
    </ul>
  );
}

export default function TransactionSummary({ summary, warnings }) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-700">합계</h2>
      <SummaryGrid summary={summary} />
      {warnings.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <h3 className="mb-2 text-xs font-bold text-slate-500">경고 ({warnings.length})</h3>
          <WarningList warnings={warnings} />
        </div>
      )}
    </section>
  );
}
