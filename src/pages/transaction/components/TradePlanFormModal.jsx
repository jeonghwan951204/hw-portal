import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import { OWNER_COMPANY_CHOICES } from "../constants";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50";

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export default function TradePlanFormModal({ editor, ownerCompany, saving, deleting, busy, error, onSubmit, onDelete, onClose }) {
  if (!editor) return null;
  const { direction, plan } = editor;
  const isPurchase = direction === "PURCHASE";
  const tradeLabel = isPurchase ? "매입 예정" : "매출 예정";

  return (
    <Modal
      title={`${tradeLabel} ${plan ? "수정" : "등록"}`}
      description="날짜, 거래처, 수량, 단가, 비고 중 하나 이상 입력해 주세요."
      onSubmit={onSubmit}
      onClose={onClose}
      closeDisabled={busy}
      footer={(
        <>
          {plan && (
            <Button variant="dangerOutline" className="mr-auto" onClick={onDelete} disabled={busy}>
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={busy}>취소</Button>
          <Button type="submit" disabled={busy}>{saving ? "저장 중..." : plan ? "저장" : "등록"}</Button>
        </>
      )}
    >
      <fieldset disabled={busy} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="자사 (선택)">
            <select name="ownerCompany" defaultValue={plan ? (plan.ownerCompany ?? "") : ownerCompany} className={inputClass}>
              <option value="">선택 안 함</option>
              {OWNER_COMPANY_CHOICES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="날짜">
            <input name="planDate" type="text" defaultValue={plan?.planDate ?? ""} maxLength={100} placeholder="예: 11/23 오전 9시" className={inputClass} />
          </Field>
          <Field label="거래처">
            <input name="counterparty" type="text" defaultValue={plan?.counterparty ?? ""} maxLength={200} className={inputClass} />
          </Field>
          <Field label="수량">
            <input name="quantity" type="text" defaultValue={plan?.quantity ?? ""} maxLength={200} placeholder="예: 1대 또는 20톤" className={inputClass} />
          </Field>
        </div>
        <Field label={isPurchase ? "매입 단가" : "매출 단가"}>
          <input name="purchasePrice" type="text" defaultValue={plan?.purchasePrice ?? ""} maxLength={200} className={inputClass} />
        </Field>
        <Field label="비고">
          <textarea name="memo" rows={3} defaultValue={plan?.memo ?? ""} maxLength={1000} className={inputClass} />
        </Field>
      </fieldset>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}
