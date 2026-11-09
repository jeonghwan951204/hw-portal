import { useCallback, useEffect, useRef, useState } from "react";

// window.confirm 대신 공통 ConfirmModal 을 띄우는 훅
//   const { confirm, confirmModal } = useConfirm();
//   if (!(await confirm({ title, message, confirmLabel, danger }))) return;
//   ...
//   <ConfirmModal {...confirmModal} />
// 확인 → true, 취소·ESC·배경 클릭 → false 로 끝난다.
export function useConfirm() {
  const [options, setOptions] = useState(null);
  const resolveRef = useRef(null);

  const settle = useCallback((result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback(
    (nextOptions) =>
      new Promise((resolve) => {
        // 이전 확인창이 열려 있었다면 취소로 끝낸다.
        resolveRef.current?.(false);
        resolveRef.current = resolve;
        setOptions(nextOptions);
      }),
    []
  );

  // 화면을 벗어나면 기다리던 쪽을 취소로 풀어 준다.
  useEffect(() => () => resolveRef.current?.(false), []);

  return {
    confirm,
    confirmModal: {
      open: Boolean(options),
      title: options?.title,
      message: options?.message,
      confirmLabel: options?.confirmLabel,
      cancelLabel: options?.cancelLabel,
      danger: options?.danger,
      onConfirm: () => settle(true),
      onCancel: () => settle(false),
    },
  };
}
