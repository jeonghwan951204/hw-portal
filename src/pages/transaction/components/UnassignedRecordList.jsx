import {
  formatDate,
  formatWeight,
  labelOf,
  ownerCompanyLabelOf,
  TRADE_DIRECTION_LABELS,
} from "../constants";
import CompanySelect from "../../contract/components/CompanySelect";
import { Badge } from "./Badges";

const cellInputClass =
  "w-full min-w-0 rounded-md border border-blue-300 bg-white px-2 py-1 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20";

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

// 행 선택 토글과 겹치지 않도록 매핑 영역 클릭은 행으로 전파하지 않는다
const stop = (event) => event.stopPropagation();

// 매핑 칸 공통 — 이름을 누르면 매핑 여부와 상관없이 그 자리에서 바로 매핑(재매핑)한다
//  - 매핑됨: 내부 정식명(원본명이 다르면 아래에 작게)
//  - 미매핑: 원본명(없으면 미입력 배지) + '미매핑'/'확인 필요' 배지
function MappingCell({ mappedName, sourceName, emptyLabel, status, mapped, editing, saving, editor, onStart, onCancel }) {
  if (editing) {
    return (
      <span className="flex min-w-0 items-center gap-1" onClick={stop}>
        <span className="min-w-0 flex-1">{editor}</span>
        <button type="button" onClick={onCancel} disabled={saving} className="shrink-0 px-1 text-xs text-slate-400 hover:text-slate-600" aria-label="매핑 취소">
          ✕
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onStart();
      }}
      disabled={saving}
      title="눌러서 매핑"
      className="block w-full min-w-0 rounded px-1 text-left hover:bg-blue-50 disabled:opacity-40"
    >
      {mapped ? (
        <>
          <span className="block truncate underline decoration-dotted underline-offset-2" title={mappedName}>{mappedName}</span>
          {sourceName && sourceName !== mappedName && (
            <span className="block truncate text-[10px] font-normal text-slate-400" title={sourceName}>원본: {sourceName}</span>
          )}
        </>
      ) : (
        <span className="flex min-w-0 flex-wrap items-center gap-1">
          {sourceName ? (
            <span className="truncate underline decoration-dotted underline-offset-2" title={sourceName}>{sourceName}</span>
          ) : (
            <Badge tone="amber">{emptyLabel}</Badge>
          )}
          <Badge tone="amber">{status === "AMBIGUOUS" ? "확인 필요" : "미매핑"}</Badge>
        </span>
      )}
    </button>
  );
}

function CounterpartyCell({ record, list }) {
  const editing = list.inlineEdit?.id === record.weighingRecordId && list.inlineEdit.field === "company";
  return (
    <MappingCell
      mappedName={record.companyName}
      sourceName={record.sourceCounterpartyName}
      emptyLabel="거래처 미입력"
      status={record.companyMatchStatus}
      mapped={record.companyId != null}
      editing={editing}
      saving={list.mappingSavingId === record.weighingRecordId}
      editor={
        <CompanySelect
          value={record.companyId ?? ""}
          selectedName={record.companyName ?? ""}
          onSelect={(company) => list.onMapCompany(record, company)}
          className={cellInputClass}
          {...list.mappingCompanySearch}
        />
      }
      onStart={() => list.onStartMapping(record, "company")}
      onCancel={list.onCancelMapping}
    />
  );
}

function ItemCell({ record, list }) {
  const editing = list.inlineEdit?.id === record.weighingRecordId && list.inlineEdit.field === "item";
  return (
    <MappingCell
      mappedName={record.itemName}
      sourceName={record.sourceItemName}
      emptyLabel="품목 미입력"
      status={record.itemMatchStatus}
      mapped={record.itemId != null}
      editing={editing}
      saving={list.mappingSavingId === record.weighingRecordId}
      editor={
        <select
          value={record.itemId ?? ""}
          autoFocus
          disabled={list.mappingSavingId === record.weighingRecordId}
          onChange={(event) => list.onMapItem(record, event.target.value)}
          className={cellInputClass}
          aria-label="매핑할 품목"
        >
          <option value="">품목 선택</option>
          {list.items.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      }
      onStart={() => list.onStartMapping(record, "item")}
      onCancel={list.onCancelMapping}
    />
  );
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

export default function UnassignedRecordList(list) {
  const { records, totalCount, loading, error, selectedIds, onToggleRecords, onToggleVehicle, onRetry } = list;

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
              <th className="w-[5%] px-2 py-2 text-center font-semibold" title="일자별 계량 순번">순번</th>
              <th className="w-[16%] px-2 py-2 text-left font-semibold">거래처</th>
              <th className="w-[10%] px-2 py-2 text-left font-semibold">차량번호</th>
              <th className="w-[9%] px-2 py-2 text-left font-semibold">품목</th>
              <th className="w-[9%] px-2 py-2 text-right font-semibold">1차중량</th>
              <th className="w-[9%] px-2 py-2 text-right font-semibold">2차중량</th>
              <th className="w-[8%] px-2 py-2 text-right font-semibold">실중량</th>
              <th className="w-[9%] px-2 py-2 text-right font-semibold">인수량</th>
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
                  <td className="px-2 py-2 text-center font-mono text-slate-500">{record.dailySequence ?? "-"}</td>
                  <td className="px-2 py-2 font-semibold text-slate-800">
                    <CounterpartyCell record={record} list={list} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    <VehicleButton vehicleNumber={record.vehicleNumber} onToggleVehicle={onToggleVehicle} />
                  </td>
                  <td className="px-2 py-2 text-slate-600">
                    <ItemCell record={record} list={list} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-600">{formatWeight(record.firstWeightKg)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-600">{formatWeight(record.secondWeightKg)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-700">{formatWeight(record.netWeightKg)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-700">{formatWeight(record.acceptedWeightKg)}</td>
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
                  <div className="min-w-0 text-sm font-bold text-slate-800">
                    <CounterpartyCell record={record} list={list} />
                  </div>
                </div>
                <p className="shrink-0 text-xs text-slate-400">
                  {record.dailySequence != null && <span className="mr-1 font-mono">#{record.dailySequence}</span>}
                  {formatDate(record.weighingDate)} {timeOf(record)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <OwnerDirectionBadge record={record} />
                <VehicleButton vehicleNumber={record.vehicleNumber} onToggleVehicle={onToggleVehicle} />
                <span className="min-w-0 flex-1 text-slate-500"><ItemCell record={record} list={list} /></span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between gap-2"><dt className="text-slate-400">1차중량</dt><dd className="font-medium text-slate-600">{formatWeight(record.firstWeightKg)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-400">2차중량</dt><dd className="font-medium text-slate-600">{formatWeight(record.secondWeightKg)}</dd></div>
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
