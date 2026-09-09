import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteCompany, fetchCompanies } from "../api/companyApi";
import { useCompanyTypeOptions } from "./useCompanyTypeOptions";

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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

  const companies = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("ko-KR");
    return sourceCompanies.filter(
      (company) =>
        (!typeFilter || company.type === typeFilter) &&
        (!normalizedKeyword ||
          company.name.toLocaleLowerCase("ko-KR").includes(normalizedKeyword) ||
          company.aliases?.some((alias) =>
            alias.toLocaleLowerCase("ko-KR").includes(normalizedKeyword)
          ))
    );
  }, [keyword, sourceCompanies, typeFilter]);

  const toggleDetail = (companyId) => {
    setExpandedId((current) => (current === companyId ? null : companyId));
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
    typeFilterOptions,
    typeLabelOf,
    totalCount: sourceCompanies.length,
    loading,
    error,
    expandedId,
    deleteTarget,
    deleting,
    deleteError,
    copyMessage,
    keyword,
    typeFilter,
    onKeywordChange: setKeyword,
    onTypeFilterChange: setTypeFilter,
    onToggleDetail: toggleDetail,
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
