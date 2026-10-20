import { useState } from "react";
import { formatNumber } from "../constants";
import NumericInput from "./NumericInput";

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400";
const LABEL_CLASS = "block text-[11px] font-bold text-slate-500 mb-1";

// 기존 거래 내용 수정 (결제 정보는 PaymentForm에서 별도 처리)
export default function TransactionEditForm({
  tx,
  itemOptions = [],
  priceTypeOptions = [],
  isExport,
  unitHint,
  // 마지막 정산 거래 — 수량 변경 시 정산가 재계산 미리보기
  onQuantityChange,
  settlementPreview,
  settlementCalculating,
  settlementError,
  submitting,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState({
    itemId: String(tx.itemId ?? ""),
    transactionDate: tx.transactionDate ?? "",
    quantity: tx.quantity ?? "",
    unitPrice: tx.unitPrice ?? "",
    priceType: tx.priceType ?? "",
    memo: tx.memo ?? "",
  });

  const handleChange = (field, value) => {
    if (["quantity", "unitPrice"].includes(field) && value !== "" && Number(value) < 0) {
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "quantity" && tx.finalSettlement) onQuantityChange?.(value);
  };

  const availablePriceTypes = tx.finalSettlement
    ? priceTypeOptions.filter((option) => option.value === tx.priceType)
    : priceTypeOptions.filter((option) => option.value !== "SETTLEMENT");
  const editablePriceTypes = availablePriceTypes.some(
    (option) => option.value === tx.priceType
  )
    ? availablePriceTypes
    : [
        {
          value: tx.priceType,
          label: tx.priceTypeLabel ?? tx.priceType,
        },
        ...availablePriceTypes,
      ];
  const quantityValid = form.quantity !== "" && Number(form.quantity) > 0;
  const moneyDigits = isExport ? 2 : 0;
  // 마지막 정산 거래는 재계산된 정산가가 있어야 저장 (단가는 서버가 다시 계산)
  const unitPriceValid = tx.finalSettlement
    ? !settlementCalculating && !!settlementPreview
    : form.unitPrice !== "";
  const canSave =
    form.itemId !== "" &&
    form.transactionDate !== "" &&
    form.priceType !== "" &&
    quantityValid &&
    unitPriceValid;

  const handleSave = () => {
    if (!canSave || submitting) return;
    onSave(tx.transactionId, {
      itemId: Number(form.itemId),
      transactionDate: form.transactionDate,
      quantity: Number(form.quantity),
      unitPrice: tx.finalSettlement ? undefined : Number(form.unitPrice),
      priceType: form.priceType,
      memo: form.memo,
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-slate-600">거래 내역 수정</p>
        {tx.finalSettlement && (
          <p className="text-xs text-violet-500">
            마지막 정산 거래는 품목이 고정되며, 정산가는 수량에 따라 다시 계산됩니다.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className={LABEL_CLASS}>납품일</label>
          <input
            type="date"
            value={form.transactionDate}
            onChange={(e) => handleChange("transactionDate", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>품목</label>
          <select
            value={form.itemId}
            onChange={(e) => handleChange("itemId", e.target.value)}
            disabled={tx.finalSettlement}
            className={INPUT_CLASS}
          >
            <option value="">선택</option>
            {itemOptions.map((item) => (
              <option key={item.itemId} value={item.itemId}>
                {item.itemName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>단가유형</label>
          <select
            value={form.priceType}
            onChange={(e) => handleChange("priceType", e.target.value)}
            disabled={tx.finalSettlement}
            className={INPUT_CLASS}
          >
            <option value="">선택</option>
            {editablePriceTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>수량(kg)</label>
          <NumericInput
            value={form.quantity}
            onChange={(value) => handleChange("quantity", value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>단가</label>
          <NumericInput
            value={
              tx.finalSettlement
                ? settlementPreview
                  ? String(settlementPreview.settlementUnitPrice)
                  : ""
                : form.unitPrice
            }
            placeholder={
              tx.finalSettlement ? (settlementCalculating ? "계산 중..." : "자동 계산") : "단가"
            }
            onChange={(value) => handleChange("unitPrice", value)}
            disabled={tx.finalSettlement}
            className={INPUT_CLASS}
          />
        </div>
        {tx.finalSettlement && (
          <div className="sm:col-span-2 lg:col-span-5 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-xs">
            {settlementCalculating ? (
              <p className="font-semibold text-violet-500">정산가 계산 중...</p>
            ) : settlementError ? (
              <p className="font-semibold text-rose-500">{settlementError}</p>
            ) : settlementPreview ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-violet-700">
                <span>
                  재계산 정산 단가{" "}
                  <strong className="font-mono">
                    {formatNumber(settlementPreview.settlementUnitPrice, moneyDigits)} {unitHint}
                  </strong>
                </span>
                <span>
                  정산금액{" "}
                  <strong className="font-mono">
                    {formatNumber(settlementPreview.settlementAmount, moneyDigits)}
                    {isExport ? " USD" : " 원"}
                  </strong>
                </span>
              </div>
            ) : (
              <p className="text-violet-500">수량을 입력하면 정산가를 다시 계산합니다.</p>
            )}
          </div>
        )}
        <div className="sm:col-span-2 lg:col-span-5">
          <label className={LABEL_CLASS}>거래 메모</label>
          <input
            type="text"
            value={form.memo}
            placeholder="(선택)"
            onChange={(e) => handleChange("memo", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || submitting}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            canSave && !submitting
              ? "text-white bg-blue-600 hover:bg-blue-700 active:scale-95"
              : "text-slate-400 bg-slate-100 cursor-not-allowed"
          }`}
        >
          {submitting ? "저장 중..." : "수정 저장"}
        </button>
      </div>
    </div>
  );
}
