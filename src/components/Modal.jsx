import { useEffect, useId, useRef } from "react";

// 공통 모달 틀 — 제목·설명·본문·하단 버튼 영역
// size: sm(확인창) / md(기본) / lg / xl(표가 넓은 상세 화면)
// closeDisabled: 저장·삭제 중처럼 닫히면 안 될 때 배경 클릭·ESC·닫기 버튼을 막는다.
// onSubmit 을 넘기면 패널이 <form> 이 되어 Enter 로 제출된다.
const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
};

// 모달이 겹쳐 열렸을 때 ESC 로 맨 위 모달만 닫기 위한 스택
const openModalStack = [];

export default function Modal({
  open = true,
  title,
  description,
  children,
  footer,
  onClose,
  onSubmit,
  size = "md",
  closeDisabled = false,
  bodyClassName = "space-y-4 px-6 py-4",
}) {
  const titleId = useId();
  const closeRef = useRef(null);

  // ESC 핸들러가 항상 최신 onClose·closeDisabled 를 보도록 맞춘다.
  useEffect(() => {
    closeRef.current = closeDisabled ? null : onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const token = {};
    openModalStack.push(token);
    const handleKeyDown = (e) => {
      if (e.key !== "Escape" || openModalStack[openModalStack.length - 1] !== token) return;
      closeRef.current?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      openModalStack.splice(openModalStack.indexOf(token), 1);
    };
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    if (!closeDisabled) onClose?.();
  };
  const Panel = onSubmit ? "form" : "div";
  const panelProps = onSubmit
    ? {
        onSubmit: (e) => {
          e.preventDefault();
          onSubmit(e);
        },
      }
    : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={handleClose} />
      <Panel
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[90vh] w-full flex-col rounded-xl border border-slate-200 bg-white shadow-xl animate-fadeIn ${SIZES[size]}`}
        {...panelProps}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-slate-800">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              aria-label="닫기"
              onClick={handleClose}
              disabled={closeDisabled}
              className="-mr-2 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-3">{footer}</div>}
      </Panel>
    </div>
  );
}
