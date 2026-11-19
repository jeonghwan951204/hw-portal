import Button from "../../../components/Button";
import ConfirmModal from "../../../components/ConfirmModal";
import Toast from "../../contract/components/Toast";
import {
  formatDate,
  formatMoney,
  formatNumber,
  OWNER_COMPANY_OPTIONS,
  ownerCompanyLabelOf,
  PAYMENT_STATUS_LABELS,
} from "../constants";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import TradePlanFormModal from "./TradePlanFormModal";
import TransactionDetailModal from "./TransactionDetailModal";

const CELL = "truncate border-r border-slate-200/60 px-0.5 py-px align-middle first:pl-1 last:border-r-0 last:pr-1";
const DIRECTIONS = [
  { key: "PURCHASE", planTitle: "매입 잔량", planLabel: "매입 예정", paymentTitle: "결제해줄 업체", amountBasis: "공급가 + 세액 · 부가세 결제 건은 공급가만" },
  { key: "SALE", planTitle: "매출 잔량", planLabel: "매출 예정", paymentTitle: "결제받을 업체", amountBasis: "공급가" },
];
const dateTimeFormat = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

function StatusTable({ title, description, result, hasRows, columns, isPayment, children, footer }) {
  const message = !result
    ? "불러오는 중입니다."
    : result.failed
      ? "조회에 실패했습니다. 새로고침으로 다시 시도하세요."
      : hasRows ? "" : "조회된 내역이 없습니다.";
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-2.5 py-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h2 className="text-[13px] font-bold text-slate-900">{title}</h2>
          <p className="text-[11px] text-slate-500">{description}</p>
        </div>
        {result?.loadedAt && (
          <p className="whitespace-nowrap text-[11px] text-slate-500">
            {isPayment ? "결제 조회 시각" : "조회 시각"}{" "}
            <time dateTime={result.loadedAt.toISOString()}>{dateTimeFormat.format(result.loadedAt)}</time>
          </p>
        )}
      </div>
      <table aria-label={title} className="w-full table-fixed text-left text-[11px] leading-4">
        <thead className={`whitespace-nowrap text-slate-700 ${isPayment ? "bg-amber-50" : "bg-blue-50"}`}>
          <tr>
            {columns.map(({ label, className }) => (
              <th key={label} scope="col" className={`${CELL} ${className}`}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {message ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-4 text-center">
                <p role={result?.failed ? "alert" : "status"} className={result?.failed ? "text-red-600" : "text-slate-500"}>
                  {message}
                </p>
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
      {!message && footer}
    </section>
  );
}

const PLAN_COLUMNS = [
  { label: "거래처", className: "w-[30%]" },
  { label: "수량", className: "w-[14%]" },
  { label: "단가", className: "w-[24%]" },
  { label: "비고", className: "" },
];
const PAYMENT_COLUMNS = [
  { label: "날짜", className: "w-9 sm:w-11" },
  { label: "거래처", className: "w-[17%] sm:w-[15%]" },
  { label: "차량", className: "w-12 sm:w-16" },
  { label: "품목", className: "" },
  { label: "자사", className: "w-8 sm:w-9" },
  { label: "총금액", className: "w-[5.75rem] text-right sm:w-[6.75rem]" },
];

function PlanTable({ direction, result, onOpenPlan }) {
  const rows = result?.rows?.filter((row) => row.tradeDirection === direction.key) ?? [];
  return (
    <StatusTable
      title={direction.planTitle}
      description={direction.planLabel}
      result={result}
      hasRows={rows.length > 0}
      columns={PLAN_COLUMNS}
    >
      {rows.map((row) => {
        const counterparty = [
          row.planDate,
          row.counterparty || "—",
          row.ownerCompany && `(${ownerCompanyLabelOf(row.ownerCompany)})`,
        ].filter(Boolean).join(" ");

        return (
          <tr
            key={row.planId}
            className="cursor-pointer hover:bg-blue-50/60 focus-within:bg-blue-50/60"
            onClick={() => onOpenPlan(direction.key, row)}
          >
            <td className={CELL}>
              <button
                type="button"
                className="block max-w-full cursor-pointer truncate text-left font-semibold text-slate-900 focus-visible:underline"
                title={counterparty}
                aria-label={`${direction.planLabel} ${counterparty} 수정`}
              >
                {counterparty}
              </button>
            </td>
            <td className={CELL} title={row.quantity ?? undefined}>{row.quantity || "—"}</td>
            <td className={CELL} title={row.purchasePrice ?? undefined}>{row.purchasePrice || "—"}</td>
            <td className={`${CELL} text-slate-500`} title={row.memo ?? undefined}>{row.memo || "—"}</td>
          </tr>
        );
      })}
    </StatusTable>
  );
}

function PaymentTotals({ totals }) {
  return (
    <dl className="border-t border-amber-100 bg-amber-50/50 px-2.5 py-1.5 text-[11px] leading-4">
      {totals.map(({ ownerCompany, totalAmount, totalAmountText, missingAmountCount }) => (
        <div key={ownerCompany} className="flex flex-wrap items-baseline justify-between gap-x-3">
          <dt className="font-semibold text-slate-700">{ownerCompanyLabelOf(ownerCompany)} 합계</dt>
          <dd className="text-right font-bold tabular-nums text-slate-900" title={totalAmount == null ? undefined : formatMoney(totalAmount)}>
            {totalAmountText ?? "산정 전"}
            {missingAmountCount > 0 && <span className="ml-2 font-normal text-amber-800">금액 미산정 건 제외</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PaymentTable({ direction, result, onOpenDetail }) {
  const rows = result?.rows?.filter((row) => row.tradeDirection === direction.key) ?? [];
  const totals = result?.totals?.filter((total) => total.tradeDirection === direction.key) ?? [];
  return (
    <StatusTable
      title={direction.paymentTitle}
      description={direction.amountBasis}
      result={result}
      hasRows={rows.length > 0}
      columns={PAYMENT_COLUMNS}
      isPayment
      footer={<PaymentTotals totals={totals} />}
    >
      {rows.map((row) => {
        const counterparty = row.counterpartyName || "거래처 미입력";
        const vehicleNumbers = row.vehicleNumbers.map((number) => number.trim().slice(-4)).join(", ");
        const items = row.items.map(({ itemName, unitPrice }) =>
          `${itemName} ${unitPrice == null ? "미입력" : formatNumber(unitPrice, 4)}`
        ).join(" · ");
        const amount = row.totalAmount == null ? "산정 전" : formatMoney(row.totalAmount);
        const suffix = direction.key === "PURCHASE" && row.paymentStatus === "VAT_PAID" ? " (변제)" : "";
        const amountDetails = [`${amount}${suffix}`, PAYMENT_STATUS_LABELS[row.paymentStatus]]
          .filter(Boolean).join(" · ");

        return (
          <tr key={row.transactionId}>
            <td className={`${CELL} tabular-nums text-slate-500`} title={formatDate(row.transactionDate)}>
              <time dateTime={row.transactionDate}>{row.transactionDate.slice(5).replace("-", "/")}</time>
            </td>
            <td className={CELL}>
              <button
                type="button"
                className="block max-w-full truncate text-left font-semibold text-blue-700 hover:underline"
                title={counterparty}
                aria-label={`${counterparty} 거래 #${row.transactionId} 상세`}
                onClick={() => onOpenDetail(row.transactionId)}
              >
                {counterparty}
              </button>
            </td>
            <td className={`${CELL} tabular-nums`} title={vehicleNumbers}>{vehicleNumbers || "—"}</td>
            <td className={CELL} title={items}>{items || "—"}</td>
            <td className={CELL}>{ownerCompanyLabelOf(row.ownerCompany)}</td>
            <td className={`${CELL} text-right font-semibold tabular-nums text-slate-900`} title={amountDetails}>
              {`${row.totalAmountText ?? amount}${suffix}`}
            </td>
          </tr>
        );
      })}
    </StatusTable>
  );
}

export default function PaymentStatusTab() {
  const { payments, plans, ownerCompany, onOwnerCompanyChange, onRefresh, onOpenDetail, detailModal,
    onOpenPlan, planModal, deletePlanConfirm, toast } = usePaymentStatus();
  const unclassifiedCount = payments?.rows?.filter((row) => row.tradeDirection !== "PURCHASE" && row.tradeDirection !== "SALE").length ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          자사
          <select value={ownerCompany} onChange={(event) => onOwnerCompanyChange(event.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs">
            {OWNER_COMPANY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <Button variant="outline" size="sm" onClick={onRefresh}>새로고침</Button>
        {DIRECTIONS.map((direction) => (
          <Button key={direction.key} variant="outline" size="sm" onClick={() => onOpenPlan(direction.key)}>
            {direction.planLabel} 등록
          </Button>
        ))}
      </div>

      <div className="grid items-start gap-2 xl:grid-cols-2">
        {DIRECTIONS.map((direction) => <PlanTable key={direction.key} direction={direction} result={plans} onOpenPlan={onOpenPlan} />)}
      </div>
      {unclassifiedCount > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          매입·매출 구분이 없는 거래 {unclassifiedCount}건은 거래 내역에서 확인해 주세요.
        </p>
      )}
      <div className="grid items-start gap-2 min-[1680px]:grid-cols-2">
        {DIRECTIONS.map((direction) => <PaymentTable key={direction.key} direction={direction} result={payments} onOpenDetail={onOpenDetail} />)}
      </div>
      <TransactionDetailModal {...detailModal} />
      <TradePlanFormModal {...planModal} />
      <ConfirmModal {...deletePlanConfirm} />
      <Toast toast={toast} />
    </>
  );
}
