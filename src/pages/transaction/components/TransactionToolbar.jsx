const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option.value || "ALL"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function TransactionToolbar({
  startDate,
  endDate,
  ownerCompany,
  transactionOrigin,
  tradeDirection,
  confirmed,
  paymentStatus,
  transactionStatus,
  keyword,
  ownerCompanyOptions,
  originOptions,
  tradeDirectionOptions,
  confirmedOptions,
  paymentStatusOptions,
  transactionStatusOptions,
  dateLimits,
  hasFilters,
  onDateRangeChange,
  onFilterChange,
  onReset,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[minmax(19rem,1.3fr)_minmax(12rem,1fr)]">
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold text-slate-500">거래일</legend>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              type="date"
              value={startDate}
              max={dateLimits.startMax}
              onChange={(event) => onDateRangeChange("startDate", event.target.value)}
              aria-label="거래일 시작일"
              className={inputClass}
            />
            <span className="text-xs text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              min={dateLimits.endMin}
              onChange={(event) => onDateRangeChange("endDate", event.target.value)}
              aria-label="거래일 종료일"
              className={inputClass}
            />
          </div>
        </fieldset>

        <label className="min-w-0">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">거래처명</span>
          <input
            type="search"
            value={keyword}
            onChange={(event) => onFilterChange("keyword", event.target.value)}
            placeholder="거래처명 검색"
            className={`${inputClass} placeholder:text-slate-400`}
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(6,minmax(0,1fr))_auto] lg:items-end">
        <SelectField label="자사" value={ownerCompany} options={ownerCompanyOptions} onChange={(value) => onFilterChange("ownerCompany", value)} />
        <SelectField label="생성 유형" value={transactionOrigin} options={originOptions} onChange={(value) => onFilterChange("transactionOrigin", value)} />
        <SelectField label="거래구분" value={tradeDirection} options={tradeDirectionOptions} onChange={(value) => onFilterChange("tradeDirection", value)} />
        <SelectField label="확인상태" value={confirmed} options={confirmedOptions} onChange={(value) => onFilterChange("confirmed", value)} />
        <SelectField label="결제상태" value={paymentStatus} options={paymentStatusOptions} onChange={(value) => onFilterChange("paymentStatus", value)} />
        <SelectField label="거래상태" value={transactionStatus} options={transactionStatusOptions} onChange={(value) => onFilterChange("transactionStatus", value)} />
        <button
          type="button"
          onClick={onReset}
          disabled={!hasFilters}
          className="h-[38px] rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          초기화
        </button>
      </div>
    </section>
  );
}
