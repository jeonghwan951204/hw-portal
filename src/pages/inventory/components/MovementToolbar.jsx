import { INPUT_CLASS, ItemSelect, SegmentedFilter } from "./Fields";

export default function MovementToolbar({
  startDate,
  endDate,
  ownerCompany,
  itemId,
  movementType,
  ownerCompanyOptions,
  movementTypeOptions,
  itemOptions,
  dateLimits,
  hasFilters,
  onDateRangeChange,
  onOwnerCompanyChange,
  onItemIdChange,
  onMovementTypeChange,
  onReset,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(19rem,1.4fr)_auto_auto] xl:items-end">
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold text-slate-500">발생일</legend>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              type="date"
              value={startDate}
              max={dateLimits.startMax}
              onChange={(event) => onDateRangeChange("startDate", event.target.value)}
              aria-label="조회 시작일"
              className={INPUT_CLASS}
            />
            <span className="text-xs text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              min={dateLimits.endMin}
              onChange={(event) => onDateRangeChange("endDate", event.target.value)}
              aria-label="조회 종료일"
              className={INPUT_CLASS}
            />
          </div>
        </fieldset>
        <SegmentedFilter label="자사" value={ownerCompany} options={ownerCompanyOptions} onChange={onOwnerCompanyChange} />
        <SegmentedFilter label="유형" value={movementType} options={movementTypeOptions} onChange={onMovementTypeChange} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(12rem,20rem)_auto] sm:items-end sm:justify-between">
        <label className="min-w-0">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">품목 (출발 또는 도착)</span>
          <ItemSelect value={itemId} itemOptions={itemOptions} placeholder="전체 품목" onChange={onItemIdChange} />
        </label>
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
