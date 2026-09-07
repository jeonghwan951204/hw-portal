import { useMemo, useState } from "react";
import { deleteMockCompany, getMockCompanies } from "../api/companyMockApi";

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
  const [sourceCompanies, setSourceCompanies] = useState(getMockCompanies);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const companies = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("ko-KR");
    return sourceCompanies.filter(
      (company) =>
        (!typeFilter || company.type === typeFilter) &&
        (!normalizedKeyword || company.name.toLocaleLowerCase("ko-KR").includes(normalizedKeyword))
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
    setTimeout(() => setCopyMessage(""), 1800);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const nextCompanies = deleteMockCompany(deleteTarget.id);
    setSourceCompanies(nextCompanies);
    setExpandedId((current) => (current === deleteTarget.id ? null : current));
    setDeleteTarget(null);
  };

  return {
    companies,
    totalCount: sourceCompanies.length,
    expandedId,
    deleteTarget,
    copyMessage,
    keyword,
    typeFilter,
    onKeywordChange: setKeyword,
    onTypeFilterChange: setTypeFilter,
    onToggleDetail: toggleDetail,
    onCopy: copyValue,
    onDeleteRequest: setDeleteTarget,
    onDeleteConfirm: confirmDelete,
    onDeleteCancel: () => setDeleteTarget(null),
  };
}
