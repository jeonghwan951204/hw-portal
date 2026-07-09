import { useCallback, useEffect, useRef, useState } from "react";

// 성공/오류 토스트 공용 훅 — showToast("success" | "error", 메시지)
export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((type, message) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ type, message });
    timerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  return { toast, showToast };
}
