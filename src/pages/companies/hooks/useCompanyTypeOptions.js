import { useEffect, useState } from "react";
import { fetchCompanyTypeOptions } from "../api/enumsApi";
import { ALL_COMPANY_TYPE_OPTION, COMPANY_TYPE_FALLBACK_OPTIONS } from "../constants";

// 거래처 유형 옵션 모듈 캐시 (화면 간 재조회 방지, enum 은 거의 불변)
let cache = null;
let pending = null;

const loadCompanyTypeOptions = () => {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;

  pending = fetchCompanyTypeOptions()
    .then((options) => {
      cache = options?.length ? options : COMPANY_TYPE_FALLBACK_OPTIONS;
      return cache;
    })
    // 조회에 실패하면 기본 선택값으로 화면을 유지한다(실패는 캐시하지 않아 다음 진입 때 재조회).
    .catch(() => COMPANY_TYPE_FALLBACK_OPTIONS)
    .finally(() => {
      pending = null;
    });

  return pending;
};

/**
 * 거래처 유형 선택값을 조회해 셀렉트·필터·표시명 변환에 사용할 값을 반환한다.
 * @returns {{ typeOptions: {value:string,label:string}[], typeFilterOptions: {value:string,label:string}[], typeOptionsLoading: boolean, typeLabelOf: (value: string) => string }}
 */
export function useCompanyTypeOptions() {
  const [typeOptions, setTypeOptions] = useState(() => cache ?? COMPANY_TYPE_FALLBACK_OPTIONS);
  const [loading, setLoading] = useState(() => !cache);

  useEffect(() => {
    if (cache) {
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    loadCompanyTypeOptions().then((options) => {
      if (!alive) return;
      setTypeOptions(options);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  return {
    typeOptions,
    typeFilterOptions: [ALL_COMPANY_TYPE_OPTION, ...typeOptions],
    typeOptionsLoading: loading,
    // 코드값 → 표시명 (예: "PURCHASE" → "매입처")
    typeLabelOf: (value) => typeOptions.find((option) => option.value === value)?.label ?? value ?? "-",
  };
}
