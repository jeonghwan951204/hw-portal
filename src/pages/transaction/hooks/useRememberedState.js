import { useEffect, useState } from "react";

// 화면을 떠났다 돌아와도 값을 이어 쓰기 위한 메모리 저장소 — 새로고침하면 비워진다
const store = new Map();

// useState 와 같지만 같은 key 로 다시 마운트되면 마지막 값을 복원한다.
// 거래관리 화면 간 이동(목록 ↔ 거래 등록) 시 검색 조건 유지에 쓴다.
export function useRememberedState(key, initialValue) {
  const [value, setValue] = useState(() =>
    store.has(key) ? store.get(key) : typeof initialValue === "function" ? initialValue() : initialValue
  );

  useEffect(() => {
    store.set(key, value);
  }, [key, value]);

  return [value, setValue];
}
