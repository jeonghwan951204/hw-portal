import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompanySearch } from "../../contract/hooks/useCompanySearch";
import { useToast } from "../../contract/hooks/useToast";
import { createManualTransaction } from "../api/transactionApi";
import {
  createEmptyManualItem,
  CURRENCY_OPTIONS,
  getLocalDateString,
  MANUAL_TRADE_DIRECTION_OPTIONS,
  manualItemToRequest,
  OWNER_COMPANY_CHOICES,
  validateManualItem,
} from "../constants";
import { useItemOptions } from "./useItemOptions";

export function useManualTransactionForm() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const companySearch = useCompanySearch();
  const items = useItemOptions();
  const [header, setHeader] = useState(() => ({
    transactionDate: getLocalDateString(),
    ownerCompany: "",
    companyId: null,
    counterpartyName: "",
    tradeDirection: "",
    currency: "KRW",
    memo: "",
  }));
  // 행 key 는 추가·삭제 시 입력 상태가 섞이지 않도록 별도로 둔다
  const [rows, setRows] = useState(() => [{ key: 1, value: createEmptyManualItem() }]);
  const [nextKey, setNextKey] = useState(2);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!header.transactionDate) return "거래일을 입력하세요.";
    if (!header.ownerCompany) return "자사를 선택하세요.";
    if (!header.tradeDirection) return "입출고 구분을 선택하세요.";
    if (rows.length === 0) return "품목을 한 건 이상 입력하세요.";
    for (const [index, row] of rows.entries()) {
      const message = validateManualItem(row.value);
      if (message) return `${index + 1}번째 품목: ${message}`;
    }
    return "";
  };

  const submit = async () => {
    const message = validate();
    setError(message);
    if (message) return;

    setSubmitting(true);
    try {
      await createManualTransaction({
        ownerCompany: header.ownerCompany,
        companyId: header.companyId,
        counterpartyName: header.counterpartyName.trim() || null,
        tradeDirection: header.tradeDirection,
        transactionDate: header.transactionDate,
        currency: header.currency,
        memo: header.memo.trim() || null,
        items: rows.map((row) => manualItemToRequest(row.value, header.tradeDirection)),
      });
      // 상세는 목록의 모달로 확인하므로 등록 후 목록으로 돌아간다
      navigate("/transactions", { replace: true });
    } catch (submitError) {
      showToast("error", submitError.message || "수기 거래를 등록하지 못했습니다.");
      setSubmitting(false);
    }
  };

  return {
    header: {
      ...header,
      ownerCompanyOptions: OWNER_COMPANY_CHOICES,
      tradeDirectionOptions: MANUAL_TRADE_DIRECTION_OPTIONS,
      currencyOptions: CURRENCY_OPTIONS,
      companySearch,
      onChange: (patch) => setHeader((current) => ({ ...current, ...patch })),
    },
    itemRows: {
      rows,
      items,
      tradeDirection: header.tradeDirection,
      onRowChange: (key, patch) =>
        setRows((current) => current.map((row) => (row.key === key ? { ...row, value: { ...row.value, ...patch } } : row))),
      onAddRow: () => {
        setRows((current) => [...current, { key: nextKey, value: createEmptyManualItem() }]);
        setNextKey((current) => current + 1);
      },
      onRemoveRow: (key) => setRows((current) => current.filter((row) => row.key !== key)),
    },
    submitBar: {
      error,
      submitting,
      onSubmit: submit,
      onCancel: () => navigate("/transactions"),
    },
    toast,
  };
}
