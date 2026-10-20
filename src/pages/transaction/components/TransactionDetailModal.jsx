import { formatDate, formatMoney, ownerCompanyLabelOf } from "../constants";
import { Badge, DirectionBadge, MappedName, OriginBadge, PaymentBadge, TransactionStatusBadge } from "./Badges";
import ModalShell from "./ModalShell";

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-700">{children ?? "-"}</dd>
    </div>
  );
}

// 거래 상세 모달 — 상세 구성은 추후 확정 예정이라 지금은 목록 요약값만 보여준다.
// (목록 행 또는 합치기 응답의 거래 상세를 그대로 받으며, 두 응답에 공통인 필드만 사용한다)
export default function TransactionDetailModal({ transaction, onClose }) {
  if (!transaction) return null;

  return (
    <ModalShell
      wide
      title={`거래 #${transaction.transactionId}`}
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          닫기
        </button>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        <OriginBadge origin={transaction.transactionOrigin} />
        <DirectionBadge direction={transaction.tradeDirection} />
        <PaymentBadge status={transaction.paymentStatus} />
        <TransactionStatusBadge status={transaction.transactionStatus} />
      </div>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
        <InfoItem label="거래일">{formatDate(transaction.transactionDate)}</InfoItem>
        <InfoItem label="자사"><Badge>{ownerCompanyLabelOf(transaction.ownerCompany)}</Badge></InfoItem>
        <InfoItem label="거래처">
          <MappedName name={transaction.counterpartyName} mapped={transaction.companyId != null} emptyLabel="거래처 미입력" />
        </InfoItem>
        <InfoItem label="표시금액">{formatMoney(transaction.displayAmount, transaction.currency)}</InfoItem>
        <InfoItem label="결제금액">{formatMoney(transaction.paymentAmount, transaction.currency)}</InfoItem>
        <InfoItem label="비고"><span className="whitespace-pre-line">{transaction.memo || "-"}</span></InfoItem>
      </dl>
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">상세 구성은 준비 중입니다.</p>
    </ModalShell>
  );
}
