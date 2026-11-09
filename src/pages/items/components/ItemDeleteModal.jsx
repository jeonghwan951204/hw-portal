import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

export default function ItemDeleteModal({ item, childCount = 0, deleting, error, onConfirm, onCancel }) {
  if (!item) return null;

  const blocked = childCount > 0;

  return (
    <Modal
      size="sm"
      title={blocked ? "삭제할 수 없는 품목입니다" : "품목을 삭제할까요?"}
      onClose={onCancel}
      closeDisabled={deleting}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={deleting}>
            {blocked ? "닫기" : "취소"}
          </Button>
          {!blocked && (
            <Button variant="danger" onClick={onConfirm} disabled={deleting}>
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          )}
        </>
      }
    >
      <p className="text-sm leading-6 text-slate-600">
        {blocked ? (
          <>
            <strong className="font-bold text-slate-800">{item.name}</strong>에 하위 품목이 {childCount}개
            있습니다. 하위 품목을 먼저 삭제하거나 다른 상위 품목으로 옮겨 주세요.
          </>
        ) : (
          <>
            <strong className="font-bold text-slate-800">{item.name}</strong> 품목과 별칭이 목록에서 삭제됩니다.
          </>
        )}
      </p>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
    </Modal>
  );
}
