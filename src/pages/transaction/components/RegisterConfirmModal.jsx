import { formatDate, formatWeight, labelOf, ownerCompanyLabelOf, TRADE_DIRECTION_LABELS } from "../constants";
import ModalShell from "./ModalShell";

function InfoItem({ label, note, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-800">{children ?? "-"}</dd>
      {note && <p className="text-[10px] text-amber-600">{note}</p>}
    </div>
  );
}

// 계근 선택 등록 확인 — 선택 요약, 거래처 불일치 확인, 비고
export default function RegisterConfirmModal({
  open,
  count,
  records,
  counterpartyNames,
  counterpartyMismatch,
  acceptedWeightKg,
  acceptedMissing,
  dateFrom,
  dateTo,
  blocker,
  memo,
  allowMismatch,
  submitting,
  onMemoChange,
  onAllowMismatchChange,
  onSubmit,
  onClose,
}) {
  if (!open) return null;

  const [first] = records;
  const vehicleCount = new Set(records.map((record) => record.vehicleNumber).filter(Boolean)).size;
  const disabled = submitting || Boolean(blocker) || (counterpartyMismatch && !allowMismatch);

  return (
    <ModalShell
      wide
      title="거래 등록"
      description="선택한 계근을 하나의 거래로 묶습니다. 거래일은 가장 최근 계량일자, 거래처는 가장 먼저 계량한 계근의 거래처로 정해집니다."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
        <InfoItem label="계근">{count}건 · 차량 {vehicleCount}대</InfoItem>
        <InfoItem label="자사-입출고">
          {first ? `${ownerCompanyLabelOf(first.ownerCompany)}-${labelOf(TRADE_DIRECTION_LABELS, first.tradeDirection ?? "UNKNOWN")}` : "-"}
        </InfoItem>
        <InfoItem label="계량일자">
          {dateFrom === dateTo ? formatDate(dateFrom) : `${formatDate(dateFrom)} ~ ${formatDate(dateTo)}`}
        </InfoItem>
        <InfoItem label="총 중량 (인수량)" note={acceptedMissing ? "인수량 미입력 계근 제외" : null}>
          {formatWeight(acceptedWeightKg)}
        </InfoItem>
        <InfoItem label="거래처">
          <span className="whitespace-pre-line">{counterpartyNames.map((name) => name || "거래처 미입력").join("\n")}</span>
        </InfoItem>
      </dl>

      {first?.tradeDirection == null && !blocker && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          입출고 구분을 알 수 없는 계근입니다. 등록은 가능하지만 결제 완료 전에 거래구분을 지정해야 합니다.
        </p>
      )}
      {blocker && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{blocker}</p>}
      {!blocker && counterpartyMismatch && (
        <label className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <input
            type="checkbox"
            checked={allowMismatch}
            onChange={(event) => onAllowMismatchChange(event.target.checked)}
            className="mt-0.5 accent-amber-600"
          />
          거래처가 서로 다른 계근이 섞여 있습니다. 하나의 거래로 묶는 것이 맞다면 체크한 뒤 등록하세요.
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">비고 (선택)</span>
        <textarea
          value={memo}
          onChange={(event) => onMemoChange(event.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
        />
      </label>
    </ModalShell>
  );
}
