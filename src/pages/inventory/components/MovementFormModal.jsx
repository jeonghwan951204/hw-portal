import ModalShell from "../../transaction/components/ModalShell";
import { ADJUSTMENT_DIRECTION_OPTIONS, MOVEMENT_OWNER_OPTIONS, REASON_MAX_LENGTH } from "../constants";
import { FieldLabel, INPUT_CLASS, ItemSelect, SegmentedFilter } from "./Fields";

const MODE_OPTIONS = [
  { value: "TRANSFER", label: "품목 간 이동" },
  { value: "ADJUSTMENT", label: "재고 증감" },
];

const DESCRIPTIONS = {
  TRANSFER: "같은 자사 안에서 출발 품목의 재고를 도착 품목으로 옮깁니다. 전체 재고 합계는 변하지 않습니다.",
  ADJUSTMENT: "계근에 없는 재고를 넣거나 뺍니다. 기초재고 입력, 폐기·분실 등에 사용합니다.",
};

// 품목 간 이동·재고 증감 등록 — 등록 후에는 수정·삭제 없이 보정 내역에서 취소만 할 수 있다
export default function MovementFormModal({
  form,
  today,
  itemOptions,
  blocker,
  shortageWarning,
  submitting,
  error,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!form) return null;
  const isTransfer = form.mode === "TRANSFER";

  return (
    <ModalShell
      title="재고 보정"
      description={DESCRIPTIONS[form.mode]}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={Boolean(blocker) || submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </>
      }
    >
      <div className="flex flex-wrap gap-4">
        <SegmentedFilter label="유형" value={form.mode} options={MODE_OPTIONS} onChange={(value) => onChange("mode", value)} />
        <SegmentedFilter label="자사" value={form.ownerCompany} options={MOVEMENT_OWNER_OPTIONS} onChange={(value) => onChange("ownerCompany", value)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="발생일">
          <input
            type="date"
            value={form.occurredDate}
            max={today}
            onChange={(event) => onChange("occurredDate", event.target.value)}
            className={INPUT_CLASS}
          />
        </FieldLabel>
        <FieldLabel label="수량(kg)">
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={form.quantity}
            onChange={(event) => onChange("quantity", event.target.value)}
            placeholder="0"
            className={`${INPUT_CLASS} text-right`}
          />
        </FieldLabel>

        {isTransfer ? (
          <>
            <FieldLabel label="출발 품목">
              <ItemSelect value={form.fromItemId} itemOptions={itemOptions} onChange={(value) => onChange("fromItemId", value)} />
            </FieldLabel>
            <FieldLabel label="도착 품목">
              <ItemSelect value={form.toItemId} itemOptions={itemOptions} onChange={(value) => onChange("toItemId", value)} />
            </FieldLabel>
          </>
        ) : (
          <>
            <FieldLabel label="품목">
              <ItemSelect value={form.itemId} itemOptions={itemOptions} onChange={(value) => onChange("itemId", value)} />
            </FieldLabel>
            <SegmentedFilter label="증감" value={form.direction} options={ADJUSTMENT_DIRECTION_OPTIONS} onChange={(value) => onChange("direction", value)} />
          </>
        )}
      </div>

      <FieldLabel label={`사유 (선택, ${REASON_MAX_LENGTH}자 이하)`}>
        <input
          type="text"
          value={form.reason}
          maxLength={REASON_MAX_LENGTH}
          onChange={(event) => onChange("reason", event.target.value)}
          placeholder={isTransfer ? "비우면 '품목 이동'" : "비우면 '재고 추가' / '재고 차감'"}
          className={INPUT_CLASS}
        />
      </FieldLabel>

      {form.occurredDate && form.occurredDate < today && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          과거 날짜로 등록하면 그날 이후의 기준일 재고가 모두 바뀝니다.
        </p>
      )}
      {shortageWarning && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{shortageWarning}</p>}
      {blocker && <p className="text-xs text-slate-400">{blocker}</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </ModalShell>
  );
}
