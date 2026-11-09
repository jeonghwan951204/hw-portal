import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

export default function CompanyDeleteModal({ company, deleting, error, onConfirm, onCancel }) {
  if (!company) return null;

  return (
    <Modal
      size="sm"
      title="거래처를 삭제할까요?"
      onClose={onCancel}
      closeDisabled={deleting}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={deleting}>
            취소
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? "삭제 중..." : "삭제"}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-slate-600">
        <strong className="font-bold text-slate-800">{company.name}</strong>의 정보가 목록에서 삭제됩니다.
      </p>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
    </Modal>
  );
}
