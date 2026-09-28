export default function ItemDeleteModal({ item, childCount = 0, deleting, error, onConfirm, onCancel }) {
  if (!item) return null;

  const blocked = childCount > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-delete-title"
      onMouseDown={(event) => {
        if (!deleting && event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="item-delete-title" className="text-lg font-bold text-slate-800">
          {blocked ? "삭제할 수 없는 품목입니다" : "품목을 삭제할까요?"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {blocked ? (
            <>
              <strong className="font-bold text-slate-700">{item.name}</strong>에 하위 품목이{" "}
              {childCount}개 있습니다. 하위 품목을 먼저 삭제하거나 다른 상위 품목으로 옮겨 주세요.
            </>
          ) : (
            <>
              <strong className="font-bold text-slate-700">{item.name}</strong> 품목과 별칭이
              목록에서 삭제됩니다.
            </>
          )}
        </p>
        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {blocked ? "닫기" : "취소"}
          </button>
          {!blocked && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
