import NumericInput from "../../contract/components/NumericInput";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import {
  formatDate,
  formatMoney,
  formatSettlementDiff,
  formatWeight,
  SETTLEMENT_LINE_TYPE_LABELS,
  settlementDiffToneOf,
} from "../constants";

const inputClass =
  "w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300";

// 매출/반품 구분 배지 — 반품은 금액이 아니라 재고로 돌아오는 줄이라 색을 달리한다
export function SettlementTypeBadge({ isReturn }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-bold ${
        isReturn ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
      }`}
    >
      {SETTLEMENT_LINE_TYPE_LABELS[isReturn ? "RETURN" : "SALE"]}
    </span>
  );
}

// 품목 나누기·반품 — 계근 1줄을 계산서 기준 매출 줄(품목·단가)과 반품 줄(재고로 돌아온 수량)로 나눈다
export default function SettlementLinesModal({
  open,
  target,
  items,
  lines,
  summary,
  currency,
  saving,
  error,
  validation,
  returnItemName,
  returnAddable,
  removable,
  onLineChange,
  onSaleLineAdd,
  onReturnLineAdd,
  onLineRemove,
  onQuantityBlur,
  baseLineKey,
  onSave,
  onRemoveAll,
  onClose,
}) {
  if (!open || !target) return null;

  const source = target.source;
  const title = `품목 나누기·반품 — ${formatDate(source.weighingDate)} ${target.vehicleNumber || ""} ${target.itemName || "품목 미입력"}`;

  return (
    <Modal
      size="xl"
      title={title}
      description={`실중량 ${formatWeight(target.netWeightKg)} · 매출 줄은 계산서 한 줄씩 입력해 금액에 반영하고, 반품 줄은 돌아온 수량만큼 재고에 다시 더합니다.`}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          {removable && (
            <Button
              variant="dangerOutline"
              className="mr-auto"
              onClick={onRemoveAll}
              disabled={saving}
              title="매출·반품 줄을 모두 지우고 적용 단가 + 실제출고량 방식으로 돌아갑니다. 반품으로 늘었던 재고도 사라집니다."
            >
              나누기 해제
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button onClick={onSave} disabled={saving || Boolean(validation)} title={validation || undefined}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] text-[13px]">
          <thead className="text-xs text-slate-400">
            <tr>
              <th className="w-14 px-1.5 pb-2 text-left font-semibold">구분</th>
              <th className="w-[15%] px-1.5 pb-2 text-left font-semibold">품목</th>
              <th className="w-[15%] px-1.5 pb-2 text-left font-semibold">계산서 품목명</th>
              <th className="w-[12%] px-1.5 pb-2 text-right font-semibold">수량(kg)</th>
              <th className="w-[12%] px-1.5 pb-2 text-right font-semibold">단가(원/kg)</th>
              <th className="w-[14%] px-1.5 pb-2 text-right font-semibold">금액</th>
              <th className="px-1.5 pb-2 text-left font-semibold">메모</th>
              <th className="w-8 pb-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key} className={`align-top ${line.isReturn ? "bg-violet-50/40" : ""}`}>
                <td className="px-1.5 py-2.5">
                  <SettlementTypeBadge isReturn={line.isReturn} />
                </td>
                <td className="px-1.5 py-1">
                  {line.isReturn ? (
                    // 반품 품목은 계근 품목으로 고정 — 선택칸 없이 글자로만 보여준다
                    <span className="block px-2 py-1.5 text-slate-700" title="반품 품목은 계근 품목으로 고정됩니다">
                      {returnItemName ?? "품목 미매핑"} <span className="text-[11px] text-slate-400">(계근)</span>
                    </span>
                  ) : (
                    <select
                      value={line.itemId}
                      onChange={(event) => onLineChange(line.key, { itemId: event.target.value })}
                      aria-label="내부 품목"
                      className={`${inputClass} ${line.itemId ? "" : "border-amber-300"}`}
                    >
                      <option value="">선택</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-1.5 py-1">
                  <input
                    type="text"
                    value={line.isReturn ? "" : line.invoiceItemName}
                    onChange={(event) => onLineChange(line.key, { invoiceItemName: event.target.value })}
                    disabled={line.isReturn}
                    placeholder={line.isReturn ? "-" : "비우면 품목명과 같음"}
                    aria-label="계산서 품목명"
                    className={inputClass}
                  />
                </td>
                <td className="px-1.5 py-1">
                  <NumericInput
                    value={line.quantityKg}
                    onChange={(value) => onLineChange(line.key, { quantityKg: value })}
                    onBlur={() => onQuantityBlur(line.key)}
                    placeholder="0"
                    aria-label={line.isReturn ? "반품 수량(kg)" : "수량(kg)"}
                    className={`${inputClass} text-right`}
                  />
                  {line.key === baseLineKey && lines.length > 1 && (
                    <span className="mt-0.5 block text-right text-[11px] text-slate-400">기준 줄</span>
                  )}
                </td>
                <td className="px-1.5 py-1">
                  <NumericInput
                    value={line.isReturn ? "" : line.unitPrice}
                    onChange={(value) => onLineChange(line.key, { unitPrice: value })}
                    disabled={line.isReturn}
                    placeholder={line.isReturn ? "-" : "0"}
                    aria-label="단가(원/kg)"
                    className={`${inputClass} text-right`}
                  />
                </td>
                <td className="whitespace-nowrap px-1.5 py-2.5 text-right font-mono font-semibold">
                  {line.isReturn ? (
                    <span className="text-violet-600">재고 +{formatWeight(Number(line.quantityKg) || 0)}</span>
                  ) : (
                    <span className="text-slate-800">{formatMoney(line.amount, currency)}</span>
                  )}
                </td>
                <td className="px-1.5 py-1">
                  <input
                    type="text"
                    value={line.memo}
                    onChange={(event) => onLineChange(line.key, { memo: event.target.value })}
                    placeholder={line.isReturn ? "반품 사유" : "품목변경 사유 등"}
                    aria-label="메모"
                    className={inputClass}
                  />
                </td>
                <td className="py-1 text-center">
                  <button
                    type="button"
                    onClick={() => onLineRemove(line.key)}
                    aria-label="정산 줄 삭제"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onSaleLineAdd}>
          + 매출 줄 추가
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onReturnLineAdd}
          disabled={!returnAddable}
          title={returnAddable ? `${returnItemName} 재고로 돌아온 수량을 입력합니다` : "계근 품목을 먼저 매핑해주세요"}
        >
          + 반품 줄 추가
        </Button>
        {!returnAddable && <span className="self-center text-xs text-amber-600">계근 품목을 먼저 매핑해주세요. 반품 품목은 계근 품목으로 고정됩니다.</span>}
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 px-4 py-3 sm:grid-cols-5">
        <div>
          <dt className="text-xs font-semibold text-slate-400">매출 수량</dt>
          <dd className="font-mono text-sm font-bold text-slate-800">{formatWeight(summary.saleQuantityKg)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-400">매출 금액</dt>
          <dd className="font-mono text-sm font-bold text-slate-800">{formatMoney(summary.saleAmount, currency)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-400">반품</dt>
          <dd className="font-mono text-sm font-bold text-violet-600">{formatWeight(summary.returnedWeightKg)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-400">계근 실중량</dt>
          <dd className="font-mono text-sm font-bold text-slate-800">{formatWeight(target.netWeightKg)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-400">실중량 대비 차이</dt>
          <dd className={`font-mono text-sm font-bold ${settlementDiffToneOf(summary.diffKg)}`}>
            {formatSettlementDiff(summary.diffKg, summary.diffPercent)}
          </dd>
        </div>
      </dl>

      {summary.diffKg > 0 && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          매출 + 반품 수량이 계근 실중량보다 많습니다. 계산서 수량을 확인하세요. (저장은 가능합니다)
        </p>
      )}
      {(error || validation) && (
        <p className={`text-sm ${error ? "text-red-600" : "text-slate-400"}`}>{error || validation}</p>
      )}
      <ul className="list-disc space-y-0.5 pl-4 text-xs text-slate-400">
        <li>추가한 매출·반품 줄의 수량을 입력하고 칸을 벗어나면, 그만큼 첫 매출 줄(기준 줄) 수량에서 자동으로 빠집니다. 줄을 지우면 다시 돌려줍니다.</li>
        <li>차이 = (매출 수량 + 반품 수량) − 실중량. 반품까지 넣으면 계근 오차만 남습니다.</li>
        <li>품목을 고르면 계산서 품목명에 같은 이름이 채워집니다. 계산서에 다른 이름(예: 부스바)으로 적혀 있을 때만 고치세요.</li>
        <li>반품 품목은 계근 품목으로 고정되며, 계근 품목을 나중에 고치면 반품 품목도 함께 바뀝니다.</li>
        <li>반품분이 다른 거래처로 바로 간 경우는 반품 줄이 아니라 수기 매출 거래로 등록하세요.</li>
        <li>금액은 입력 중 미리 계산한 값이며, 저장 후에는 서버 계산 값으로 바뀝니다.</li>
      </ul>
    </Modal>
  );
}
