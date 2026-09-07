import { useMemo, useState } from "react";
import { MOCK_COMPANIES } from "../mockData";

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
  const [expandedId, setExpandedId] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const companies = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("ko-KR");
    return MOCK_COMPANIES.filter(
      (company) =>
        (!typeFilter || company.type === typeFilter) &&
        (!normalizedKeyword || company.name.toLocaleLowerCase("ko-KR").includes(normalizedKeyword))
    );
  }, [keyword, typeFilter]);

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

  return {
    companies,
    totalCount: MOCK_COMPANIES.length,
    expandedId,
    copyMessage,
    keyword,
    typeFilter,
    onKeywordChange: setKeyword,
    onTypeFilterChange: setTypeFilter,
    onToggleDetail: toggleDetail,
    onCopy: copyValue,
  };
}
