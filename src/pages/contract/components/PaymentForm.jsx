import { useState } from "react";
import { formatNumber } from "../constants";
import NumericInput from "./NumericInput";

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const LABEL_CLASS = "block text-[11px] font-bold text-slate-500 mb-1";
const numberOrUndefined = (value) =>
  value === "" || value == null ? undefined : Number(value);

// 기존 거래의 결제 정보 등록·수정
export default function PaymentForm({ isExport, tx, submitting, onSave, onCancel }) {
  const [form, setForm] = useState({
    paidForeign: tx.paidForeign ?? "",
    paidExchange: tx.paidExchange ?? "",
    paidAmount: tx.paidAmount ?? "",
    paidDate: tx.paidDate ?? "",
    paymentMemo: tx.paymentMemo ?? "",
  });

  const handleChange = (field, value) => {
    if (
      ["paidForeign", "paidExchange", "paidAmount"].includes(field) &&
      value !== "" &&
      Number(value) < 0
    ) {
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const exchangePairValid =
    (form.paidExchange === "" && form.paidAmount === "") ||
    (form.paidExchange !== "" && form.paidAmount !== "");
  const canSave = isExport
    ? form.paidForeign !== "" && exchangePairValid
    : form.paidAmount !== "";

  const handleSave = () => {
    if (!canSave || submitting) return;
    onSave(tx.transactionId, {
      paidCurrency: isExport ? "USD" : "KRW",
      paidForeign: isExport ? numberOrUndefined(form.paidForeign) : undefined,
      paidExchange: isExport ? numberOrUndefined(form.paidExchange) : undefined,
      paidAmount: numberOrUndefined(form.paidAmount),
      paidDate: form.paidDate || undefined,
      paymentMemo: form.paymentMemo || undefined,
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-slate-600">
          결제 {tx.paid ? "수정" : "입력"}
        </p>
        <p className="text-xs text-slate-400">
          정산금액 {formatNumber(tx.amount, isExport ? 2 : 0)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {isExport && (
          <>
            <div>
              <label className={LABEL_CLASS}>수취 외화(USD)</label>
              <NumericInput
                value={form.paidForeign}
                onChange={(value) => handleChange("paidForeign", value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>환전 환율</label>
              <NumericInput
                value={form.paidExchange}
                onChange={(value) => handleChange("paidExchange", value)}
                className={INPUT_CLASS}
              />
            </div>
          </>
        )}
        <div>
          <label className={LABEL_CLASS}>{isExport ? "원화 입금액" : "실입금액"}</label>
          <NumericInput
            value={form.paidAmount}
            onChange={(value) => handleChange("paidAmount", value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>입금일</label>
          <input
            type="date"
            value={form.paidDate}
            onChange={(e) => handleChange("paidDate", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={LABEL_CLASS}>결제 메모</label>
          <input
            type="text"
            placeholder="(선택)"
            value={form.paymentMemo}
            onChange={(e) => handleChange("paymentMemo", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {isExport && !exchangePairValid && (
        <p className="text-xs text-rose-500">
          환전 정보를 입력하려면 환전 환율과 원화 입금액을 함께 입력하세요.
        </p>
      )}

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
          {submitting ? "저장 중..." : "결제 저장"}
        </button>
      </div>
    </div>
  );
}
