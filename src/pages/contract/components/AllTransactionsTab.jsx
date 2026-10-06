import { Link } from "react-router-dom";
import Pagination from "../../../components/Pagination";
import { formatDate, formatNumber } from "../constants";
import CompanySelect from "./CompanySelect";

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30";
const LABEL_CLASS = "mb-1 block text-[11px] font-bold text-slate-500";
const formatValueWithUnit = (value, unit, digits = 0) =>
  value == null || value === "" ? "-" : `${formatNumber(value, digits)} ${unit}`;

function TransactionsFilter({
  startDate,
  endDate,
  companySelect,
  dateLimits,
  hasFilters,
  onDateRangeChange,
  onSearch,
  onReset,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-end">
        <div>
          <label className={LABEL_CLASS}>시작일</label>
          <input
            type="date"
            value={startDate}
            max={dateLimits.startMax}
            onChange={(event) => onDateRangeChange("startDate", event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>종료일</label>
          <input
            type="date"
            value={endDate}
            min={dateLimits.endMin}
            onChange={(event) => onDateRangeChange("endDate", event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>계약 거래처</label>
          <CompanySelect {...companySelect} className={INPUT_CLASS} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSearch}
            className="flex-1 rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 lg:flex-none"
          >
            검색
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={!hasFilters}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors lg:flex-none ${
              hasFilters
                ? "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
            }`}
          >
            초기화
          </button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        날짜를 선택하지 않으면 전체 기간의 거래내역을 조회합니다.
      </p>
    </div>
  );
}

function TransactionRows({ contractId, tradeType, transactions }) {
  return transactions.map((transaction) => {
    const isExport = tradeType === "EXPORT";
    const unitPriceDigits = isExport ? 2 : 0;
    const unitSuffix = transaction.unitPriceUnit === "TON" ? "ton" : "kg";
    const unitPriceUnit = `${isExport ? "USD" : "원"}/${unitSuffix}`;

    return (
      <tr key={`${contractId}-${transaction.transactionId}`}>
        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
          {formatDate(transaction.transactionDate)}
        </td>
        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{transaction.itemName}</td>
        <td className="px-4 py-3 text-right font-mono text-slate-600 whitespace-nowrap">
          {formatValueWithUnit(transaction.quantity, "kg")}
        </td>
        <td className="px-4 py-3 text-right font-mono text-slate-600 whitespace-nowrap">
          {formatValueWithUnit(transaction.unitPrice, unitPriceUnit, unitPriceDigits)}
        </td>
        <td className="px-4 py-3 text-right font-mono text-slate-600 whitespace-nowrap">
          {formatValueWithUnit(transaction.actualUnitPriceKrwPerKg, "원/kg")}
        </td>
        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
          {formatValueWithUnit(transaction.paidAmount, "원")}
        </td>
      </tr>
    );
  });
}

function MobileTransactionCard({ transaction, tradeType }) {
  const isExport = tradeType === "EXPORT";
  const unitPriceDigits = isExport ? 2 : 0;
  const unitSuffix = transaction.unitPriceUnit === "TON" ? "ton" : "kg";
  const unitPriceUnit = `${isExport ? "USD" : "원"}/${unitSuffix}`;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-slate-400">{formatDate(transaction.transactionDate)}</p>
        <span className="shrink-0 text-xs font-semibold text-slate-500">
          {transaction.itemName}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-400">수량</dt>
          <dd className="font-mono text-slate-600">
            {formatValueWithUnit(transaction.quantity, "kg")}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-400">단가</dt>
          <dd className="font-mono text-slate-600">
            {formatValueWithUnit(transaction.unitPrice, unitPriceUnit, unitPriceDigits)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-400">실단가</dt>
          <dd className="font-mono text-slate-600">
            {formatValueWithUnit(transaction.actualUnitPriceKrwPerKg, "원/kg")}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-400">실제 입금액</dt>
          <dd className="font-mono font-bold text-slate-700">
            {formatValueWithUnit(transaction.paidAmount, "원")}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ContractMetric({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

function ContractTransactionGroup({ group }) {
  const transactions = group.transactions ?? [];
  const isExport = group.tradeType === "EXPORT";
  const tradeTypeLabel = isExport ? "수출" : "내수";
  const unitSuffix = group.unitPriceUnit === "TON" ? "ton" : "kg";
  const averageUnitPriceUnit = `${isExport ? "USD" : "원"}/${unitSuffix}`;

  return (
    <section className="border-b border-slate-200 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
        <div className="flex items-center gap-2">
          <h3>
            <Link
              to={`/contract/${group.contractId}`}
              className="font-bold text-slate-700 transition-colors hover:text-blue-600 hover:underline focus-visible:text-blue-600 focus-visible:outline-none focus-visible:underline"
            >
              {group.contractName}
            </Link>
          </h3>
          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            {tradeTypeLabel}
          </span>
        </div>
        <span className="text-xs text-slate-400">거래 {formatNumber(transactions.length)}건</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-slate-100 bg-white px-5 py-3 sm:grid-cols-4">
        <ContractMetric
          label="총 수량"
          value={formatValueWithUnit(group.totalQuantity, "kg")}
        />
        <ContractMetric
          label="평균단가"
          value={formatValueWithUnit(
            group.averageUnitPrice,
            averageUnitPriceUnit,
            isExport ? 2 : 0
          )}
        />
        <ContractMetric
          label="평균실단가"
          value={formatValueWithUnit(group.averageActualUnitPriceKrwPerKg, "원/kg")}
        />
        <ContractMetric
          label="총 입금액"
          value={formatValueWithUnit(group.totalPaidAmount, "원")}
        />
      </div>

      {transactions.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">
          조건에 맞는 거래내역이 없습니다.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-xs text-slate-400">
                  <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">거래날짜</th>
                  <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">품목</th>
                  <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">수량</th>
                  <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">단가</th>
                  <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">실단가</th>
                  <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">실제 입금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <TransactionRows
                  contractId={group.contractId}
                  tradeType={group.tradeType}
                  transactions={transactions}
                />
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {transactions.map((transaction) => (
              <MobileTransactionCard
                key={`${group.contractId}-${transaction.transactionId}`}
                transaction={transaction}
                tradeType={group.tradeType}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function AllTransactionsTab({ filters, list, pagination }) {
  const { contractGroups, totalCount, loading, error, onRetry } = list;

  return (
    <div className="space-y-4">
      <TransactionsFilter {...filters} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-bold text-slate-700">전체 거래내역</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">
            {formatNumber(totalCount)}개 계약
          </span>
        </div>

        {loading ? (
          <div className="px-5 py-16 text-center text-sm text-slate-400">
            전체 거래내역을 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-rose-500">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              다시 시도
            </button>
          </div>
        ) : contractGroups.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-slate-400">
            조건에 맞는 거래내역이 없습니다.
          </div>
        ) : (
          contractGroups.map((group) => (
            <ContractTransactionGroup key={group.contractId} group={group} />
          ))
        )}
      </div>

      {!loading && !error && <Pagination {...pagination} />}
    </div>
  );
}
