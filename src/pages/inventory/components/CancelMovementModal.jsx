import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import { formatDate, formatKg, movementTypeLabelOf, REASON_MAX_LENGTH } from "../constants";
import { FieldLabel, INPUT_CLASS } from "./Fields";

// 보정 취소 — 원래 발생일로 반대 방향 내역이 추가된다
export default function CancelMovementModal({ target, reason, submitting, error, onReasonChange, onSubmit, onClose }) {
  if (!target) return null;

  return (
    <Modal
      title={`보정 취소 #${target.movementId}`}
      description="취소하면 원래 발생일로 반대 방향 내역이 추가됩니다. 취소한 내역은 다시 되돌릴 수 없습니다."
      onClose={onClose}
      closeDisabled={submitting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button
            variant="danger"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? "취소 중..." : "보정 취소"}
          </Button>
        </>
      }
    >
      <dl className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
        <div>
          <dt className="text-[11px] font-bold text-slate-400">유형</dt>
          <dd className="font-semibold text-slate-700">{movementTypeLabelOf(target.movementType)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold text-slate-400">발생일</dt>
          <dd className="font-semibold text-slate-700">{formatDate(target.occurredDate)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold text-slate-400">수량</dt>
          <dd className="font-semibold text-slate-700">{formatKg(target.quantityKg)} kg</dd>
        </div>
      </dl>

      <FieldLabel label={`취소 사유 (선택, ${REASON_MAX_LENGTH}자 이하)`}>
        <input
          type="text"
          value={reason}
          maxLength={REASON_MAX_LENGTH}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder={`비우면 '보정 취소 #${target.movementId}'`}
          className={INPUT_CLASS}
        />
      </FieldLabel>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}
