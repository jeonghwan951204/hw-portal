import { Fragment } from "react";
import { PRICE_TYPE_STYLE, formatDate, formatNumber } from "../constants";
import PaymentForm from "./PaymentForm";
import TransactionStatistics from "./TransactionStatistics";
import TransactionEditForm from "./TransactionEditForm";
import NumericInput from "./NumericInput";

const INPUT_CLASS =
  "w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const LABEL_CLASS = "block text-[11px] font-bold text-slate-500 mb-1";

function PaidBadge({ paid }) {
  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
        paid
          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
          : "bg-amber-50 text-amber-600 border-amber-200"
      }`}
    >
      {paid ? "결제완료" : "미결제"}
    </span>
  );
}

// 거래 등록 + 결제(실입금) 입력 폼
function TxForm({ form, isExport, unitHint }) {
  const {
    values,
    onChange,
    itemOptions,
    priceTypeOptions,
    derivedUnitPrice,
    settlementPreview,
    settlementCalculating,
    settlementError,
    submitting,
    onSubmit,
  } = form;
  const moneyDigits = isExport ? 2 : 0;

  return (
    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 space-y-4 animate-fadeIn">
      {/* 거래 기본 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className={LABEL_CLASS}>납품일</label>
          <input type="date" value={values.date} onChange={(e) => onChange("date", e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>품목</label>
          <select value={values.itemId} onChange={(e) => onChange("itemId", e.target.value)} className={INPUT_CLASS}>
            <option value="">선택</option>
            {itemOptions.map((it) => (
              <option key={it.itemId} value={it.itemId}>{it.itemName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>단가유형</label>
          <select value={values.priceType} onChange={(e) => onChange("priceType", e.target.value)} className={INPUT_CLASS}>
            <option value="">선택</option>
            {priceTypeOptions.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>수량(kg)</label>
          <NumericInput placeholder="수량" value={values.quantity} onChange={(value) => onChange("quantity", value)} className={INPUT_CLASS} />
        </div>
      </div>

      {/* 산정단가 안내 + 마지막 거래 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="text-slate-500">
          산정단가:{" "}
          <span className="font-mono font-bold text-slate-700">
            {values.finalSettlement
              ? "서버 계산"
              : derivedUnitPrice != null
                ? `${formatNumber(derivedUnitPrice, moneyDigits)} ${unitHint}`
                : "산정 전"}
          </span>
          <span className="text-slate-400"> · 금액은 서버가 계산</span>
        </span>
        <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600">
          <input
            type="checkbox"
            checked={values.finalSettlement}
            onChange={(e) => onChange("finalSettlement", e.target.checked)}
            className="w-3.5 h-3.5 accent-blue-600"
          />
          {values.priceType === "SETTLEMENT"
            ? "마지막 거래 (정산가 적용)"
            : "마지막 거래"}
        </label>
      </div>

      {values.finalSettlement && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs">
          {settlementCalculating ? (
            <p className="font-semibold text-violet-500">정산가 계산 중...</p>
          ) : settlementError ? (
            <p className="font-semibold text-rose-500">{settlementError}</p>
          ) : settlementPreview ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-violet-700">
              <span>
                정산 단가{" "}
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
            <p className="text-violet-500">품목과 마지막 거래 수량을 입력하세요.</p>
          )}
        </div>
      )}

      {/* 결제(실입금) 함께 입력 */}
      <div className="border-t border-slate-200 pt-3">
        <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-slate-600 mb-2">
          <input type="checkbox" checked={values.withPayment} onChange={(e) => onChange("withPayment", e.target.checked)} className="w-4 h-4 accent-blue-600" />
          실결제 함께 입력
        </label>
        {values.withPayment && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {isExport && (
              <>
                <div>
                  <label className={LABEL_CLASS}>수취 외화(USD)</label>
                  <NumericInput value={values.paidForeign} onChange={(value) => onChange("paidForeign", value)} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>환전 환율</label>
                  <NumericInput value={values.paidExchange} onChange={(value) => onChange("paidExchange", value)} className={INPUT_CLASS} />
                </div>
              </>
            )}
            <div>
              <label className={LABEL_CLASS}>{isExport ? "원화 입금액" : "실입금액"}</label>
              <NumericInput value={values.paidAmount} onChange={(value) => onChange("paidAmount", value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>입금일</label>
              <input type="date" value={values.paidDate} onChange={(e) => onChange("paidDate", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div className="col-span-2 lg:col-span-4">
              <label className={LABEL_CLASS}>결제 메모</label>
              <input type="text" placeholder="(선택)" value={values.paymentMemo} onChange={(e) => onChange("paymentMemo", e.target.value)} className={INPUT_CLASS} />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={
            submitting ||
            settlementCalculating ||
            (values.finalSettlement && !settlementPreview)
          }
          className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-all active:scale-95 ${
            submitting || settlementCalculating || (values.finalSettlement && !settlementPreview)
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {submitting ? "등록 중..." : "거래 등록"}
        </button>
      </div>
    </div>
  );
}

// 탭 2 — 거래 내역: 조회 + 거래 등록·실결제 입력
export default function TransactionTab({
  transactions = [],
  isExport,
  unitHint,
  statistics,
  form,
  payment,
  edit,
}) {
  const moneyDigits = isExport ? 2 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">
          거래 내역
          <span className="ml-2 text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
            {transactions.length}건
          </span>
        </h3>
        <button
          type="button"
          onClick={form.onToggle}
          className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          {form.open ? "닫기" : "거래 등록"}
        </button>
      </div>

      {form.open && <TxForm form={form} isExport={isExport} unitHint={unitHint} />}

      {/* PC 표 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-xs">
              <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">날짜</th>
              <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">품목</th>
              <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">단가유형</th>
              <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">수량(kg)</th>
              <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">단가</th>
              <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">정산금액</th>
              <th className="px-4 py-2.5 text-center font-semibold whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  등록된 거래가 없습니다.
                </td>
              </tr>
            )}
            {transactions.map((tx) => (
              <Fragment key={tx.transactionId}>
                <tr>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(tx.transactionDate)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700">{tx.itemName}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${PRICE_TYPE_STYLE[tx.priceTypeLabel] ?? PRICE_TYPE_STYLE["원가"]}`}>
                    {tx.priceTypeLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">{formatNumber(tx.quantity)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">{formatNumber(tx.unitPrice, moneyDigits)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{formatNumber(tx.amount, moneyDigits)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <PaidBadge paid={tx.paid} />
                    <button
                      type="button"
                      onClick={() => payment.onToggle(tx.transactionId)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                    >
                      결제 {tx.paid ? "수정" : "입력"}
                    </button>
                    <button
                      type="button"
                      onClick={() => edit.onToggle(tx.transactionId)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                    >
                      거래 수정
                    </button>
                  </div>
                </td>
                </tr>
                {payment.expandedId === tx.transactionId && (
                  <tr>
                    <td colSpan={7} className="px-4 py-3 bg-slate-50/50">
                      <PaymentForm
                        isExport={isExport}
                        tx={tx}
                        submitting={payment.submittingId === tx.transactionId}
                        onSave={payment.onSave}
                        onCancel={() => payment.onToggle(tx.transactionId)}
                      />
                    </td>
                  </tr>
                )}
                {edit.expandedId === tx.transactionId && (
                  <tr>
                    <td colSpan={7} className="px-4 py-3 bg-slate-50/50">
                      <TransactionEditForm
                        tx={tx}
                        itemOptions={edit.itemOptions}
                        priceTypeOptions={edit.priceTypeOptions}
                        submitting={edit.submittingId === tx.transactionId}
                        onSave={edit.onSave}
                        onCancel={() => edit.onToggle(tx.transactionId)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드형 */}
      <div className="md:hidden divide-y divide-slate-100">
        {transactions.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-400">등록된 거래가 없습니다.</p>
        )}
        {transactions.map((tx) => (
          <div key={tx.transactionId} className="px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">{tx.itemName}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${PRICE_TYPE_STYLE[tx.priceTypeLabel] ?? PRICE_TYPE_STYLE["원가"]}`}>
                  {tx.priceTypeLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PaidBadge paid={tx.paid} />
                <button
                  type="button"
                  onClick={() => payment.onToggle(tx.transactionId)}
                  className="text-[11px] font-bold text-blue-600"
                >
                  결제 {tx.paid ? "수정" : "입력"}
                </button>
                <button
                  type="button"
                  onClick={() => edit.onToggle(tx.transactionId)}
                  className="text-[11px] font-bold text-slate-500"
                >
                  거래 수정
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-xs text-slate-400">
                {formatDate(tx.transactionDate)} · 수량 {formatNumber(tx.quantity)}kg
              </span>
              <span className="font-mono font-bold text-slate-700">
                {formatNumber(tx.amount, moneyDigits)}
              </span>
            </div>
            {payment.expandedId === tx.transactionId && (
              <div className="mt-3">
                <PaymentForm
                  isExport={isExport}
                  tx={tx}
                  submitting={payment.submittingId === tx.transactionId}
                  onSave={payment.onSave}
                  onCancel={() => payment.onToggle(tx.transactionId)}
                />
              </div>
            )}
            {edit.expandedId === tx.transactionId && (
              <div className="mt-3">
                <TransactionEditForm
                  tx={tx}
                  itemOptions={edit.itemOptions}
                  priceTypeOptions={edit.priceTypeOptions}
                  submitting={edit.submittingId === tx.transactionId}
                  onSave={edit.onSave}
                  onCancel={() => edit.onToggle(tx.transactionId)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      </div>

      <TransactionStatistics {...statistics} />
    </div>
  );
}
