import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteCompany,
  fetchCompanies,
  fetchCompanyDetail,
  fetchCompanySearchIds,
} from "../api/companyApi";
import { useCompanyTypeOptions } from "./useCompanyTypeOptions";

// 검색어 입력이 멈춘 뒤 API 를 호출하기까지의 대기 시간(ms)
const SEARCH_DEBOUNCE_MS = 300;

const copyWithFallback = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
};

export function useCompanyList() {
  const { typeFilterOptions, typeLabelOf } = useCompanyTypeOptions();
  const copyTimerRef = useRef(null);
  const [sourceCompanies, setSourceCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  // 펼친 거래처의 상세 조회 결과. companyId → { loading, data, error }
  const [details, setDetails] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  // 검색 결과 id 집합. null 이면 검색어가 없어 전체를 보여주는 상태다.
  const [searchIds, setSearchIds] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSourceCompanies(await fetchCompanies());
    } catch (loadError) {
      setError(loadError.message || "거래처 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
    return () => clearTimeout(copyTimerRef.current);
  }, [loadCompanies]);

  // 검색은 회사명·별칭 부분검색 API 로 처리하고, 입력 중 과도한 호출을 막기 위해 디바운스한다.
  useEffect(() => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      setSearchIds(null);
      setSearching(false);
      setSearchError("");
      return;
    }

    let alive = true;
    setSearching(true);
    const timer = setTimeout(() => {
      fetchCompanySearchIds(trimmedKeyword)
        .then((ids) => {
          if (!alive) return;
          setSearchIds(new Set(ids.map(String)));
          setSearchError("");
        })
        .catch((failure) => {
          if (!alive) return;
          setSearchIds(new Set());
          setSearchError(failure.message || "거래처를 검색하지 못했습니다.");
        })
        .finally(() => {
          if (alive) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [keyword]);

  const companies = useMemo(
    () =>
      sourceCompanies.filter(
        (company) =>
          (!typeFilter || company.type === typeFilter) &&
          (!searchIds || searchIds.has(String(company.id)))
      ),
    [searchIds, sourceCompanies, typeFilter]
  );

  const loadDetail = useCallback(async (companyId) => {
    setDetails((current) => ({ ...current, [companyId]: { loading: true, data: null, error: "" } }));
    try {
      const data = await fetchCompanyDetail(companyId);
      setDetails((current) => ({ ...current, [companyId]: { loading: false, data, error: "" } }));
    } catch (loadError) {
      setDetails((current) => ({
        ...current,
        [companyId]: {
          loading: false,
          data: null,
          error: loadError.message || "거래처 상세정보를 불러오지 못했습니다.",
        },
      }));
    }
  }, []);

  // 상세는 처음 펼칠 때만 조회하고, 이미 받은 상세는 다시 펼쳐도 재사용한다.
  const toggleDetail = (companyId) => {
    if (expandedId === companyId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(companyId);
    const detail = details[companyId];
    if (!detail || detail.error) loadDetail(companyId);
  };

  const copyValue = async (label, value) => {
    try {
      await copyWithFallback(value);
      setCopyMessage(`${label} 복사 완료`);
    } catch {
      setCopyMessage("복사하지 못했습니다.");
    }
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyMessage(""), 1800);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteCompany(deleteTarget.id);
      setSourceCompanies((current) =>
        current.filter((company) => company.id !== deleteTarget.id)
      );
      setExpandedId((current) => (current === deleteTarget.id ? null : current));
      setDeleteTarget(null);
    } catch (deleteFailure) {
      setDeleteError(deleteFailure.message || "거래처를 삭제하지 못했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return {
    companies,
    searching,
    searchError,
    typeFilterOptions,
    typeLabelOf,
    totalCount: sourceCompanies.length,
    loading,
    error,
    expandedId,
    expandedDetail: expandedId == null ? null : details[expandedId] ?? null,
    deleteTarget,
    deleting,
    deleteError,
    copyMessage,
    keyword,
    typeFilter,
    onKeywordChange: setKeyword,
    onTypeFilterChange: setTypeFilter,
    onToggleDetail: toggleDetail,
    onRetryDetail: loadDetail,
    onCopy: copyValue,
    onRetry: loadCompanies,
    onDeleteRequest: (company) => {
      setDeleteError("");
      setDeleteTarget(company);
    },
    onDeleteConfirm: confirmDelete,
    onDeleteCancel: () => {
      if (deleting) return;
      setDeleteError("");
      setDeleteTarget(null);
    },
  };
}
