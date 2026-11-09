import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";
const LABEL_CLASS = "mb-1.5 block text-xs font-bold text-slate-500";

export default function ItemFormModal({
  open,
  mode,
  form,
  parentOptions = [],
  saving,
  error,
  onNameChange,
  onParentChange,
  onAliasChange,
  onAliasAdd,
  onAliasRemove,
  onSubmit,
  onCancel,
}) {
  if (!open) return null;

  const title = mode === "edit" ? "품목 수정" : "품목 등록";

  return (
    <Modal
      title={title}
      onClose={onCancel}
      closeDisabled={saving}
      onSubmit={() => onSubmit()}
      bodyClassName="space-y-5 px-6 py-5"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            취소
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "저장 중..." : mode === "edit" ? "수정" : "등록"}
          </Button>
        </>
      }
    >
      <div>
        <label htmlFor="item-name" className={LABEL_CLASS}>
          품목명 <span className="text-red-500">*</span>
        </label>
        <input
          id="item-name"
          type="text"
          value={form.name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="품목명"
          autoFocus
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="item-parent" className={LABEL_CLASS}>
          상위 품목
        </label>
        <select
          id="item-parent"
          value={form.parentId}
          onChange={(event) => onParentChange(event.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">없음 (최상위 품목)</option>
          {parentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className={LABEL_CLASS}>별칭</p>
        <p className="-mt-1 mb-2 text-xs text-slate-400">
          품목을 다르게 부르는 이름을 여러 개 입력할 수 있습니다.
        </p>
        <div className="space-y-2">
          {form.aliases.map((alias) => (
            <div key={alias.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                type="text"
                value={alias.value}
                onChange={(event) => onAliasChange(alias.id, event.target.value)}
                placeholder="품목 별칭"
                aria-label="품목 별칭"
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => onAliasRemove(alias.id)}
                aria-label="품목 별칭 삭제"
                className="rounded-lg px-2 py-2 text-xs font-bold text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onAliasAdd}
          className="mt-3 rounded-lg border border-dashed border-blue-200 px-3 py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50"
        >
          + 별칭 추가
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </Modal>
  );
}
