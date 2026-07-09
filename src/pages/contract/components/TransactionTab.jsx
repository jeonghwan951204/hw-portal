import { Fragment } from "react";
import { PRICE_TYPE_STYLE, formatDate, formatNumber } from "../constants";
import PaymentForm from "./PaymentForm";

const INPUT_CLASS =
  "w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";

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

// 탭 2 — 거래 내역: 표(모바일 카드형) + 거래 바로 입력 + 결제 입력 펼침
export default function TransactionTab({
  contract,
  priceTypeOptions,
  txInput,
  onTxInputChange,
  onAddTransaction,
  mobileTxFormOpen,
  onToggleMobileTxForm,
  expandedTxId,
  onToggleExpand,
  onSavePayment,
}) {
  const isExport = contract.tradeType === "수출";
  const moneyDigits = isExport ? 2 : 0;
  const transactions = contract.transactions;

  const inputFields = (
    <>
      <input
        type="date"
        value={txInput.date}
        onChange={(e) => onTxInputChange("date", e.target.value)}
        className={INPUT_CLASS}
      />
      <select
        value={txInput.itemId}
        onChange={(e) => onTxInputChange("itemId", e.target.value)}
        className={INPUT_CLASS}
      >
        <option value="">품목 선택</option>
        {contract.items.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
      <select
        value={txInput.priceType}
        onChange={(e) => onTxInputChange("priceType", e.target.value)}
        className={INPUT_CLASS}
      >
        <option value="">단가유형 선택</option>
        {priceTypeOptions.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <input
        type="number"
        min="0"
        placeholder="수량"
        value={txInput.quantity}
        onChange={(e) => onTxInputChange("quantity", e.target.value)}
        className={INPUT_CLASS}
      />
    </>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">
          거래 내역
          <span className="ml-2 text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
            {transactions.length}건
          </span>
        </h3>
        {/* 모바일 전용 거래 추가 버튼 */}
        <button
          type="button"
          onClick={onToggleMobileTxForm}
          className="md:hidden px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          {mobileTxFormOpen ? "닫기" : "거래 추가"}
        </button>
      </div>

      {/* 모바일 입력 폼 */}
      {mobileTxFormOpen && (
        <div className="md:hidden px-5 py-4 border-b border-slate-100 space-y-2 animate-fadeIn">
          {inputFields}
          <p className="text-[11px] text-slate-400">단가·총금액은 저장 시 서버가 계산합니다.</p>
          <button
            type="button"
            onClick={onAddTransaction}
            className="w-full py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            추가
          </button>
        </div>
      )}

      {/* PC 표 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-xs">
              <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">날짜</th>
              <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">품목</th>
              <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">단가유형</th>
              <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">수량</th>
              <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">단가</th>
              <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">총금액</th>
              <th className="px-4 py-2.5 text-center font-semibold whitespace-nowrap">결제여부</th>
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
              <Fragment key={tx.id}>
                <tr
                  onClick={() => onToggleExpand(tx)}
                  className={tx.paid ? "" : "cursor-pointer hover:bg-slate-50 transition-colors"}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700">{tx.itemName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${PRICE_TYPE_STYLE[tx.priceType] ?? PRICE_TYPE_STYLE["원가"]}`}>
                      {tx.priceType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{formatNumber(tx.quantity)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{formatNumber(tx.unitPrice, moneyDigits)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{formatNumber(tx.totalAmount, moneyDigits)}</td>
                  <td className="px-4 py-3 text-center"><PaidBadge paid={tx.paid} /></td>
                </tr>
                {expandedTxId === tx.id && (
                  <tr>
                    <td colSpan={7} className="px-4 pb-4">
                      <PaymentForm contract={contract} tx={tx} onSave={onSavePayment} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}

            {/* 하단 입력 행 — 단가·금액은 서버 계산 */}
            <tr className="bg-slate-50/60">
              <td className="px-4 py-3">
                <input
                  type="date"
                  value={txInput.date}
                  onChange={(e) => onTxInputChange("date", e.target.value)}
                  className={INPUT_CLASS}
                />
              </td>
              <td className="px-4 py-3">
                <select
                  value={txInput.itemId}
                  onChange={(e) => onTxInputChange("itemId", e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">품목</option>
                  {contract.items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <select
                  value={txInput.priceType}
                  onChange={(e) => onTxInputChange("priceType", e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">단가유형</option>
                  {priceTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min="0"
                  placeholder="수량"
                  value={txInput.quantity}
                  onChange={(e) => onTxInputChange("quantity", e.target.value)}
                  className={`${INPUT_CLASS} text-right`}
                />
              </td>
              <td colSpan={2} className="px-4 py-3 text-center text-xs text-slate-400">
                서버 계산
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={onAddTransaction}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all active:scale-95"
                >
                  추가
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 모바일 카드형 */}
      <div className="md:hidden divide-y divide-slate-100">
        {transactions.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-400">등록된 거래가 없습니다.</p>
        )}
        {transactions.map((tx) => (
          <div key={tx.id} className="px-5 py-4">
            <div
              onClick={() => onToggleExpand(tx)}
              className={tx.paid ? "" : "cursor-pointer"}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">{tx.itemName}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${PRICE_TYPE_STYLE[tx.priceType] ?? PRICE_TYPE_STYLE["원가"]}`}>
                    {tx.priceType}
                  </span>
                </div>
                <PaidBadge paid={tx.paid} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-xs text-slate-400">
                  {formatDate(tx.date)} · 수량 {formatNumber(tx.quantity)}
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {formatNumber(tx.totalAmount, moneyDigits)}
                </span>
              </div>
            </div>
            {expandedTxId === tx.id && (
              <div className="mt-3">
                <PaymentForm contract={contract} tx={tx} onSave={onSavePayment} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
