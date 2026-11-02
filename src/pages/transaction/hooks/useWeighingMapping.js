import { useState } from "react";
import { mapWeighingRecord } from "../api/transactionApi";
import { useItemOptions } from "./useItemOptions";

// 계근 1건의 품목 수동 매핑 모달 상태
// 거래에 배정된 계근의 거래처는 개별 매핑할 수 없고 거래 헤더 수정으로만 바꾼다.
// target: { weighingRecordId, sourceCounterpartyName, sourceItemName, itemId, itemName }
// onMapped(result) — 저장 성공 시 호출(응답의 transactionId 가 있으면 해당 거래를 다시 받아야 한다)
export function useWeighingMapping(onMapped) {
  const [target, setTarget] = useState(null);
  const [itemId, setItemId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const open = target != null;
  const items = useItemOptions(open);

  const save = async () => {
    if (!itemId) {
      setError("품목을 선택하세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await mapWeighingRecord(target.weighingRecordId, { itemId: Number(itemId) });
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
      setItemId(record.itemId != null ? String(record.itemId) : "");
      setError("");
    },
    mappingModal: {
      open,
      target,
      itemId,
      items,
      saving,
      error,
      onItemChange: setItemId,
      onSave: save,
      onClose: () => setTarget(null),
    },
  };
}
