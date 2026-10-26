import CompanySelect from "../../contract/components/CompanySelect";
import { INPUT_CLASS, SegmentedFilter } from "./Fields";
import ItemMultiSelect from "./ItemMultiSelect";

export default function PeriodTradeToolbar({
  startDate,
  endDate,
  ownerCompany,
  companyId,
  companyName,
  itemIds,
  today,
  ownerCompanyOptions,
  companySearch,
  itemOptions,
  dateLimits,
  hasFilters,
  onDateRangeChange,
  onOwnerCompanyChange,
  onCompanyChange,
  onSelectedItemIdsChange,
  onReset,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(19rem,1.4fr)_auto_minmax(14rem,1fr)] xl:items-end">
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold text-slate-500">조회 기간 (계량일)</legend>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              type="date"
              value={startDate}
              max={dateLimits.startMax ?? today}
              onChange={(event) => onDateRangeChange("startDate", event.target.value)}
              aria-label="조회 시작일"
              className={INPUT_CLASS}
            />
            <span className="text-xs text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              min={dateLimits.endMin}
              max={today}
              onChange={(event) => onDateRangeChange("endDate", event.target.value)}
              aria-label="조회 종료일"
              className={INPUT_CLASS}
            />
          </div>
        </fieldset>
        <SegmentedFilter label="자사" value={ownerCompany} options={ownerCompanyOptions} onChange={onOwnerCompanyChange} />
        <div className="min-w-0">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">거래처</span>
          <CompanySelect
            value={companyId}
            selectedName={companyName}
            onSelect={onCompanyChange}
            className={`${INPUT_CLASS} placeholder:text-slate-400`}
            {...companySearch}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(14rem,24rem)_auto] sm:items-end sm:justify-between">
        <ItemMultiSelect itemOptions={itemOptions} selectedIds={itemIds} onChange={onSelectedItemIdsChange} />
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
