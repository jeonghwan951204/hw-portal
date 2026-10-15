// 거래 화면 공용 모달 틀 — 제목·설명·본문·하단 버튼 영역
export default function ModalShell({ title, description, children, footer, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[90vh] w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-xl animate-fadeIn ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-800">{title}</h3>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        <div className="space-y-4 overflow-y-auto px-6 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-3">{footer}</div>
      </div>
    </div>
  );
}
