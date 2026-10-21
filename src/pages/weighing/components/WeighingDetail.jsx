import { formatAmount, formatDateTime, formatNumber, formatUnitPrice, formatWeight } from "../constants";

function DetailItem({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] font-bold text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-700">{children || "-"}</dd>
    </div>
  );
}

export default function WeighingDetail({ weighing }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <p className="text-xs font-bold text-blue-600">계근 상세정보</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        <DetailItem label="1차 계량">{formatDateTime(weighing.firstWeighedAt)}</DetailItem>
        <DetailItem label="1차 중량">{formatWeight(weighing.firstWeight)}</DetailItem>
        <DetailItem label="2차 계량">{formatDateTime(weighing.secondWeighedAt)}</DetailItem>
        <DetailItem label="2차 중량">{formatWeight(weighing.secondWeight)}</DetailItem>
        <DetailItem label="실중량">{formatWeight(weighing.netWeight)}</DetailItem>
        <DetailItem label="인수량">{formatWeight(weighing.receivedWeight)}</DetailItem>
      </dl>
      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-blue-100 pt-3 sm:grid-cols-3 lg:grid-cols-6">
        <DetailItem label="원본 거래처">{weighing.companyName}</DetailItem>
        <DetailItem label="원본 품목">{weighing.itemName}</DetailItem>
        <DetailItem label="운송사">{weighing.carrierName}</DetailItem>
        <DetailItem label="계량자">{weighing.weigherName}</DetailItem>
        <DetailItem label="감량률">{weighing.deductionRate == null ? "-" : `${formatNumber(weighing.deductionRate, 3)}%`}</DetailItem>
        <DetailItem label="감량중량">{formatWeight(weighing.deductionWeight)}</DetailItem>
      </dl>
      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-blue-100 pt-3 sm:grid-cols-3">
        <DetailItem label="단가">{formatUnitPrice(weighing.unitPrice, weighing.currency, weighing.priceUnit)}</DetailItem>
        <DetailItem label="금액">{formatAmount(weighing.amount, weighing.currency)}</DetailItem>
        <DetailItem label="비고">{weighing.memo}</DetailItem>
      </dl>
      <dl className="mt-3 border-t border-blue-100 pt-3">
        <DetailItem label="계근표">
          {weighing.tickets?.length > 0 && (
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              {weighing.tickets.map((ticket, index) => (
                <a
                  key={ticket.documentId ?? ticket.fileId ?? index}
                  href={ticket.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={ticket.fileName || undefined}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                  className="font-bold text-blue-600 underline-offset-2 hover:underline"
                >
                  {ticket.fileName || `계근표 ${index + 1}`} 다운로드
                </a>
              ))}
            </span>
          )}
        </DetailItem>
      </dl>
    </div>
  );
}
