import { INPUT_CLASS, SegmentedFilter } from "./Fields";
import ItemMultiSelect from "./ItemMultiSelect";

export default function InventoryToolbar({
  asOfDate,
  today,
  ownerCompany,
  ownerCompanyOptions,
  itemOptions,
  selectedItemIds,
  hasFilters,
  onAsOfDateChange,
  onOwnerCompanyChange,
  onSelectedItemIdsChange,
  onReset,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(10rem,12rem)_auto_minmax(14rem,1fr)_auto] lg:items-end">
        <label className="min-w-0">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">기준일</span>
          <input
            type="date"
            value={asOfDate}
            max={today}
            onChange={(event) => onAsOfDateChange(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <SegmentedFilter label="자사" value={ownerCompany} options={ownerCompanyOptions} onChange={onOwnerCompanyChange} />
        <ItemMultiSelect itemOptions={itemOptions} selectedIds={selectedItemIds} onChange={onSelectedItemIdsChange} />
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
