import { INPUT_CLASS, SegmentedFilter } from "./Fields";
import ItemMultiSelect from "./ItemMultiSelect";

export default function InventoryToolbar({
  asOfDate,
  today,
  ownerCompany,
  ownerCompanyOptions,
  itemOptions,
  selectedItemIds,
  excludeMovements,
  hasFilters,
  onAsOfDateChange,
  onOwnerCompanyChange,
  onSelectedItemIdsChange,
  onExcludeMovementsChange,
  onReset,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(10rem,12rem)_auto_minmax(14rem,1fr)_auto_auto] lg:items-end">
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
        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-xs font-semibold text-slate-500">보정 내역</legend>
          <label
            title="보정 내역(재고 증감·품목 간 이동·재고 확인 보정)을 빼고 계근데이터만으로 계산합니다"
            className={`flex h-[38px] cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors ${
              excludeMovements ? "border-blue-300 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              checked={excludeMovements}
              onChange={(event) => onExcludeMovementsChange(event.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            보정 제외
          </label>
        </fieldset>
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
