import { useState } from "react";
import { useCompanySearch } from "../../contract/hooks/useCompanySearch";
import { mapWeighingRecord } from "../api/transactionApi";
import { useItemOptions } from "./useItemOptions";

// 계근 1건의 거래처·품목 수동 매핑 모달 상태
// target: { weighingRecordId, sourceCounterpartyName, sourceItemName, itemId, itemName }
// onMapped(result) — 저장 성공 시 호출(응답의 transactionId 가 있으면 해당 거래를 다시 받아야 한다)
export function useWeighingMapping(onMapped) {
  const [target, setTarget] = useState(null);
  const [company, setCompany] = useState({ id: "", name: "" });
  const [itemId, setItemId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const open = target != null;
  const companySearch = useCompanySearch(open);
  const items = useItemOptions(open);

  const save = async () => {
    if (!company.id && !itemId) {
      setError("거래처나 품목 중 하나 이상을 선택하세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // 고르지 않은 항목은 보내지 않아 기존 매핑을 유지한다
      const result = await mapWeighingRecord(target.weighingRecordId, {
        ...(company.id ? { companyId: Number(company.id) } : {}),
        ...(itemId ? { itemId: Number(itemId) } : {}),
      });
      setTarget(null);
      onMapped?.(result);
    } catch (saveError) {
      setError(saveError.message || "매핑을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return {
    openMapping: (record) => {
      setTarget(record);
      setCompany({ id: "", name: "" });
      setItemId(record.itemId != null ? String(record.itemId) : "");
      setError("");
    },
    mappingModal: {
      open,
      target,
      company,
      itemId,
      items,
      companySearch,
      saving,
      error,
      onCompanyChange: (selected) => setCompany({ id: selected.id ?? "", name: selected.name ?? "" }),
      onItemChange: setItemId,
      onSave: save,
      onClose: () => setTarget(null),
    },
  };
}
