import CompanySelect from "../../contract/components/CompanySelect";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option.value || "ALL"} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function SearchField({ label, value, placeholder, onChange }) {
  return (
    <label className="min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${inputClass} placeholder:text-slate-400`}
      />
    </label>
  );
}

// 미배정 계근 검색 — 계량일자·자사·입출고·거래처 선택·차량번호
export default function UnassignedRecordToolbar({
  startDate,
  endDate,
  ownerCompany,
  tradeDirection,
  companyId,
  companyName,
  vehicleNumber,
  companySearch,
  ownerCompanyOptions,
  tradeDirectionOptions,
  dateLimits,
  hasFilters,
  onDateRangeChange,
  onFilterChange,
  onCompanyChange,
  onReset,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[minmax(19rem,1.4fr)_minmax(8rem,0.6fr)_minmax(8rem,0.6fr)]">
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold text-slate-500">계량일자</legend>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              type="date"
              value={startDate}
              max={dateLimits.startMax}
              onChange={(event) => onDateRangeChange("startDate", event.target.value)}
              aria-label="계량일자 시작일"
              className={inputClass}
            />
            <span className="text-xs text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              min={dateLimits.endMin}
              onChange={(event) => onDateRangeChange("endDate", event.target.value)}
              aria-label="계량일자 종료일"
              className={inputClass}
            />
          </div>
        </fieldset>
        <SelectField label="자사" value={ownerCompany} options={ownerCompanyOptions} onChange={(value) => onFilterChange("ownerCompany", value)} />
        <SelectField label="입출고" value={tradeDirection} options={tradeDirectionOptions} onChange={(value) => onFilterChange("tradeDirection", value)} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="min-w-0">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">거래처</span>
          <CompanySelect
            value={companyId}
            selectedName={companyName}
            onSelect={onCompanyChange}
            className={`${inputClass} placeholder:text-slate-400`}
            {...companySearch}
          />
        </div>
        <SearchField label="차량번호" value={vehicleNumber} placeholder="차량번호 검색" onChange={(value) => onFilterChange("vehicleNumber", value)} />
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
