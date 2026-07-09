import { useState } from "react";
import { formatNumber } from "../constants";

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const LABEL_CLASS = "block text-[11px] font-bold text-slate-400 mb-1";

const nonNegative = (value) => value === "" || Number(value) >= 0;

// 결제 입력 폼 — 내수(원화)/수출(외화) 두 변형. 원화 입금액은 자동계산하지 않음(직접 입력).
export default function PaymentForm({ contract, tx, onSave }) {
  const isExport = contract.tradeType === "수출";

  const [form, setForm] = useState({
    depositDate: "",
    krwAmount: "", // 실입금액(내수) / 원화 입금액(수출)
    foreignAmount: "",
    exchangeRate: "",
  });

  const handleChange = (field, value) => {
    if (["krwAmount", "foreignAmount", "exchangeRate"].includes(field) && !nonNegative(value)) return;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 참고용 대조 표시 (입력 아님 — 계산해 보여주기만)
  const krwDiffDomestic =
    form.krwAmount === "" ? null : Number(form.krwAmount) - tx.totalAmount;
  const usdDiff =
    form.foreignAmount === "" ? null : Number(form.foreignAmount) - tx.totalAmount;
  const krwDiffExport =
    form.foreignAmount === "" || form.exchangeRate === "" || form.krwAmount === ""
      ? null
      : Number(form.krwAmount) - Number(form.foreignAmount) * Number(form.exchangeRate);

  const canSave = isExport
    ? form.foreignAmount !== "" && form.exchangeRate !== "" && form.krwAmount !== "" && form.depositDate
    : form.krwAmount !== "" && form.depositDate;

  const handleSave = () => {
    onSave(tx.id, {
      depositDate: form.depositDate,
      krwAmount: Number(form.krwAmount),
      foreignAmount: isExport ? Number(form.foreignAmount) : null,
      exchangeRate: isExport ? Number(form.exchangeRate) : null,
    });
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 animate-fadeIn">
      <p className="text-xs font-bold text-slate-500">결제 입력</p>

      {isExport ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className={LABEL_CLASS}>수취 외화 (USD)</label>
              <input
                type="number"
                min="0"
                value={form.foreignAmount}
                onChange={(e) => handleChange("foreignAmount", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>환전 환율 (원/USD)</label>
              <input
                type="number"
                min="0"
                value={form.exchangeRate}
                onChange={(e) => handleChange("exchangeRate", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>원화 입금액 (원)</label>
              <input
                type="number"
                min="0"
                value={form.krwAmount}
                onChange={(e) => handleChange("krwAmount", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>입금일</label>
              <input
                type="date"
                value={form.depositDate}
                onChange={(e) => handleChange("depositDate", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* 참고 표시 — 입력 아님 */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
            <span>
              달러 대조:{" "}
              {usdDiff == null ? "-" : (
                <span className={usdDiff === 0 ? "text-emerald-500 font-semibold" : "text-amber-500 font-semibold"}>
                  {usdDiff > 0 ? "+" : ""}{formatNumber(usdDiff, 2)} USD
                </span>
              )}
            </span>
            <span>
              원화 차액:{" "}
              {krwDiffExport == null ? "-" : (
                <span className={Math.round(krwDiffExport) === 0 ? "text-emerald-500 font-semibold" : "text-amber-500 font-semibold"}>
                  {krwDiffExport > 0 ? "+" : ""}{formatNumber(krwDiffExport)} 원
                </span>
              )}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>실입금액 (원)</label>
              <input
                type="number"
                min="0"
                value={form.krwAmount}
                onChange={(e) => handleChange("krwAmount", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>입금일</label>
              <input
                type="date"
                value={form.depositDate}
                onChange={(e) => handleChange("depositDate", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* 정산금액 대비 차액 — 표시만 */}
          <p className="text-xs text-slate-400">
            정산금액 대비 차액:{" "}
            {krwDiffDomestic == null ? "-" : (
              <span className={Math.round(krwDiffDomestic) === 0 ? "text-emerald-500 font-semibold" : "text-amber-500 font-semibold"}>
                {krwDiffDomestic > 0 ? "+" : ""}{formatNumber(krwDiffDomestic)} 원
              </span>
            )}
          </p>
        </>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            canSave
              ? "text-white bg-blue-600 hover:bg-blue-700 active:scale-95"
              : "text-slate-400 bg-slate-100 cursor-not-allowed"
          }`}
        >
          결제 저장
        </button>
      </div>
    </div>
  );
}
