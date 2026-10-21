import {
  formatDate,
  formatKgPrice,
  formatMoney,
  formatWeight,
  labelOf,
  ownerCompanyLabelOf,
  TRADE_DIRECTION_LABELS,
} from "../constants";
import { Badge } from "./Badges";

const timeOf = (record) => (record.secondWeighedAt ?? record.firstWeighedAt ?? "").slice(0, 5);

function OwnerDirectionBadge({ record }) {
  const direction = record.tradeDirection ?? "UNKNOWN";
  const tone = { PURCHASE: "blue", SALE: "violet", UNKNOWN: "amber" }[direction];
  return (
    <Badge tone={tone}>
      {ownerCompanyLabelOf(record.ownerCompany)}-{labelOf(TRADE_DIRECTION_LABELS, direction)}
    </Badge>
  );
}

function SourceName({ name, emptyLabel }) {
  return name ? <span className="truncate" title={name}>{name}</span> : <Badge tone="amber">{emptyLabel}</Badge>;
}

// 차량번호 — 누르면 현재 페이지의 같은 차량 계근을 한 번에 선택/해제
function VehicleButton({ vehicleNumber, onToggleVehicle }) {
  if (!vehicleNumber) return <span className="text-slate-400">-</span>;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggleVehicle(vehicleNumber);
      }}
      title="같은 차량 계근 전체 선택"
      className="rounded px-1 text-left text-slate-700 underline decoration-dotted underline-offset-2 hover:bg-blue-50 hover:text-blue-600"
    >
      {vehicleNumber}
    </button>
  );
}

// 이 계근의 거래처·품목을 수동 매핑 — 행 선택과 겹치지 않도록 클릭 전파를 막는다
function MapButton({ record, onMap }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onMap(record);
      }}
      title="거래처·품목 매핑"
      className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
    >
      매핑
    </button>
  );
}

export default function UnassignedRecordList({
  records,
  totalCount,
  loading,
  error,
  selectedIds,
  onToggleRecords,
  onToggleVehicle,
  onMap,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-400 shadow-sm">
        미배정 계근을 불러오는 중입니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-10 text-center shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
        <button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
          다시 시도
        </button>
      </div>
    );
  }

  const pageAllSelected = records.length > 0 && records.every((record) => selectedIds[record.weighingRecordId]);
  const emptyMessage = "검색 조건에 맞는 미배정 계근이 없습니다.";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-bold text-slate-700">미배정 계근</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{totalCount}건</span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[64rem] table-fixed text-[13px]">
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="w-[4%] px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={pageAllSelected}
                  disabled={records.length === 0}
                  onChange={() => onToggleRecords(records)}
                  aria-label="현재 페이지 전체 선택"
                  className="h-4 w-4 accent-blue-600"
                />
              </th>
              <th className="w-[11%] px-2 py-2 text-left font-semibold">계량일자</th>
              <th className="w-[10%] px-2 py-2 text-left font-semibold">자사-입출고</th>
              <th className="w-[15%] px-2 py-2 text-left font-semibold">거래처(원본)</th>
              <th className="w-[11%] px-2 py-2 text-left font-semibold">차량번호</th>
              <th className="w-[11%] px-2 py-2 text-left font-semibold">품목(원본)</th>
              <th className="w-[10%] px-2 py-2 text-right font-semibold">실중량</th>
              <th className="w-[9%] px-2 py-2 text-right font-semibold">인수량</th>
              <th className="w-[7%] px-2 py-2 text-right font-semibold">단가</th>
              <th className="w-[8%] px-2 py-2 text-right font-semibold">금액</th>
              <th className="w-[4%] px-2 py-2" aria-label="매핑" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-400">{emptyMessage}</td>
              </tr>
            )}
            {records.map((record) => {
              const selected = Boolean(selectedIds[record.weighingRecordId]);
              return (
                <tr
                  key={record.weighingRecordId}
                  onClick={() => onToggleRecords([record])}
                  className={`cursor-pointer transition-colors hover:bg-blue-50/50 ${selected ? "bg-blue-50/60" : ""}`}
                >
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => onToggleRecords([record])}
                      aria-label={`계근 ${record.weighingRecordId} 선택`}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                    {formatDate(record.weighingDate)}
                    <span className="ml-1 text-[11px] text-slate-400">{timeOf(record)}</span>
                  </td>
                  <td className="px-2 py-2"><OwnerDirectionBadge record={record} /></td>
                  <td className="px-2 py-2 font-semibold text-slate-800">
                    <SourceName name={record.sourceCounterpartyName} emptyLabel="거래처 미입력" />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    <VehicleButton vehicleNumber={record.vehicleNumber} onToggleVehicle={onToggleVehicle} />
                  </td>
                  <td className="px-2 py-2 text-slate-600">
                    <SourceName name={record.sourceItemName} emptyLabel="품목 미입력" />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-700">{formatWeight(record.netWeightKg)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-700">{formatWeight(record.acceptedWeightKg)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-600">
                    {record.unitPrice == null ? "-" : formatKgPrice(record.unitPrice, record.currency)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-700">{formatMoney(record.amount, record.currency)}</td>
                  <td className="px-1 py-2 text-center"><MapButton record={record} onMap={onMap} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {records.length === 0 && <p className="px-4 py-12 text-center text-sm text-slate-400">{emptyMessage}</p>}
        {records.map((record) => {
          const selected = Boolean(selectedIds[record.weighingRecordId]);
          return (
            <article
              key={record.weighingRecordId}
              onClick={() => onToggleRecords([record])}
              className={`cursor-pointer px-4 py-3 ${selected ? "bg-blue-50/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => onToggleRecords([record])}
                    aria-label={`계근 ${record.weighingRecordId} 선택`}
                    className="h-4 w-4 shrink-0 accent-blue-600"
                  />
                  <p className="min-w-0 text-sm font-bold text-slate-800">
                    <SourceName name={record.sourceCounterpartyName} emptyLabel="거래처 미입력" />
                  </p>
                </div>
                <p className="shrink-0 text-xs text-slate-400">{formatDate(record.weighingDate)} {timeOf(record)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <OwnerDirectionBadge record={record} />
                <VehicleButton vehicleNumber={record.vehicleNumber} onToggleVehicle={onToggleVehicle} />
                <span className="text-slate-500"><SourceName name={record.sourceItemName} emptyLabel="품목 미입력" /></span>
                <span className="ml-auto"><MapButton record={record} onMap={onMap} /></span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between gap-2"><dt className="text-slate-400">실중량</dt><dd className="font-medium text-slate-700">{formatWeight(record.netWeightKg)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-400">인수량</dt><dd className="font-medium text-slate-700">{formatWeight(record.acceptedWeightKg)}</dd></div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
