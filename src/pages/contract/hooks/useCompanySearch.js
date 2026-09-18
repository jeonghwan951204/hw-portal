import { useEffect, useState } from "react";
import { fetchCompanies } from "../api/contractApi";

const SEARCH_DEBOUNCE_MS = 250;

// 거래처 셀렉트 검색 — 회사명·별칭 부분검색(/api/companies/options?keyword=)
// 입력 중 과도한 호출을 막기 위해 디바운스한다. 빈 검색어는 전체 목록.
export function useCompanySearch() {
  const [keyword, setKeyword] = useState("");
  // 어떤 검색어의 결과인지 함께 보관 — 현재 검색어와 다르면 로딩 중으로 본다
  const [result, setResult] = useState({ query: null, options: [], error: "" });
  const query = keyword.trim();

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(
      () => {
        fetchCompanies(query || undefined)
          .then((list) => {
            if (alive) setResult({ query, options: list ?? [], error: "" });
          })
          .catch((e) => {
            if (alive)
              setResult({ query, options: [], error: e.message || "거래처를 불러오지 못했습니다" });
          });
      },
      query ? SEARCH_DEBOUNCE_MS : 0
    );

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  return {
    keyword,
    onKeywordChange: setKeyword,
    options: result.options,
    loading: result.query !== query,
    error: result.error,
  };
}
