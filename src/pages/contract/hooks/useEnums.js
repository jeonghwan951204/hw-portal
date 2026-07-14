import { useEffect, useState } from "react";
import { fetchEnum } from "../api/enumsApi";

// group → [{value,label}] 모듈 캐시 (페이지 간 재조회 방지, enum 은 거의 불변)
const cache = new Map();

/**
 * 필요한 enum 그룹들을 조회해 { enums, loading, labelOf } 반환.
 * @param {string[]} groups - ENUM_GROUPS 값 배열
 */
export function useEnums(groups) {
  const key = groups.join(",");

  const [enums, setEnums] = useState(() => {
    const init = {};
    groups.forEach((g) => cache.has(g) && (init[g] = cache.get(g)));
    return init;
  });
  const [loading, setLoading] = useState(() => groups.some((g) => !cache.has(g)));

  useEffect(() => {
    const missing = groups.filter((g) => !cache.has(g));
    if (missing.length === 0) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    Promise.all(
      missing.map(async (g) => {
        const opts = await fetchEnum(g);
        cache.set(g, opts);
      })
    )
      .then(() => {
        if (!alive) return;
        const next = {};
        groups.forEach((g) => cache.has(g) && (next[g] = cache.get(g)));
        setEnums(next);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 코드값 → 표시명 (예: CONTRACT_STATUS, "IN_PROGRESS" → "진행중")
  const labelOf = (group, value) =>
    (enums[group] ?? cache.get(group) ?? []).find((o) => o.value === value)?.label ??
    value ??
    "-";

  return { enums, loading, labelOf };
}
