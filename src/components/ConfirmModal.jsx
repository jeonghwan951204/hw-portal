import Button from "./Button";
import Modal from "./Modal";

// 등록/수정/삭제 공용 확인 모달 — danger=true면 경고(빨강) 스타일
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "예",
  cancelLabel = "아니오",
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      size="sm"
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="whitespace-pre-line text-sm leading-6 text-slate-600">{message}</p>
    </Modal>
  );
}
