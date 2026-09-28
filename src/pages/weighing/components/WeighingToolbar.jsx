function SearchField({ label, value, placeholder, onChange }) {
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
    </label>
  );
}

export default function WeighingToolbar({
  startDate,
  endDate,
  companyName,
  vehicleNumber,
  dateLimits,
  hasFilters,
  onDateRangeChange,
  onCompanyNameChange,
  onVehicleNumberChange,
  onReset,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(19rem,1.35fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_auto] lg:items-end">
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold text-slate-500">계량일자</legend>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              type="date"
              value={startDate}
              max={dateLimits.startMax}
              onChange={(event) => onDateRangeChange("startDate", event.target.value)}
              aria-label="조회 시작일"
              className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-xs text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              min={dateLimits.endMin}
              onChange={(event) => onDateRangeChange("endDate", event.target.value)}
              aria-label="조회 종료일"
              className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </fieldset>

        <SearchField
          label="거래처명"
          value={companyName}
          placeholder="거래처명 검색"
          onChange={onCompanyNameChange}
        />
        <SearchField
          label="차량번호"
          value={vehicleNumber}
          placeholder="차량번호 검색"
          onChange={onVehicleNumberChange}
        />
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
