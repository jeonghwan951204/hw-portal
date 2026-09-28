import { formatAmount, formatNumber, formatUnitPrice, formatWeight } from "../constants";

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
        <DetailItem label="계량시간">{weighing.weighedTime}</DetailItem>
        <DetailItem label="품목">{weighing.itemName}</DetailItem>
        <DetailItem label="총중량">{formatWeight(weighing.grossWeight)}</DetailItem>
        <DetailItem label="공차중량">{formatWeight(weighing.tareWeight)}</DetailItem>
        <DetailItem label="인수량">{formatWeight(weighing.receivedWeight)}</DetailItem>
        <DetailItem label="기사명">{weighing.driverName}</DetailItem>
      </dl>
      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-blue-100 pt-3 sm:grid-cols-3">
        <DetailItem label="단가">{formatUnitPrice(weighing.unitPrice)}</DetailItem>
        <DetailItem label="금액">{formatAmount(weighing.amount)}</DetailItem>
        <DetailItem label="비고">{weighing.memo}</DetailItem>
      </dl>
    </div>
  );
}
