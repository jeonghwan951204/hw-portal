import NumericInput from "../../contract/components/NumericInput";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50";

// 결제정보 — 확인 완료 후에도 수정 가능. PAID 저장 시 서버에서 거래가 마감된다.
// 부가세 금액은 자동 계산하지 않고, 결제금액으로 상태를 추론하지도 않는다.
export default function PaymentCard({
  paymentStatus,
  paymentAmount,
  currency,
  confirmed,
  disabled,
  dirty,
  statusOptions,
  onChange,
  onReset,
  onSave,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-700">결제정보</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-500">결제상태</span>
          <select value={paymentStatus} disabled={disabled} onChange={(event) => onChange({ paymentStatus: event.target.value })} className={inputClass}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
                {option.disabled ? " (확인 완료 후 선택)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-500">결제금액 ({currency})</span>
          <NumericInput value={paymentAmount} disabled={disabled} onChange={(value) => onChange({ paymentAmount: value })} className={`${inputClass} text-right`} />
        </label>
        <div className="flex gap-2">
          {dirty && (
            <button type="button" onClick={onReset} className="h-[38px] rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50">
              되돌리기
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={disabled || !dirty}
            className="h-[38px] rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {confirmed
          ? "결제 완료로 저장하면 거래가 마감됩니다. 다른 상태로 바꾸면 마감이 해제되지만 거래 확인은 유지됩니다."
          : "결제 완료는 거래 확인 후에 선택할 수 있습니다."}
      </p>
    </section>
  );
}
