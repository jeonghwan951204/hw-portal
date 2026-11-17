import { useState } from "react";
import { replaceSettlementLines, VERSION_CONFLICT_CODE } from "../api/transactionApi";
import {
  isReturnLine,
  SETTLEMENT_LINE_TYPES,
  SETTLEMENT_MAX_LINES,
  settlementLineAmountOf,
  settlementSummaryOf,
  toInputValue,
  toNumberOrNull,
} from "../constants";
import { useItemOptions } from "./useItemOptions";

let lineKeySeq = 0;
const nextLineKey = () => `line-${(lineKeySeq += 1)}`;

// kg 소수 셋째 자리까지 — 빼고 더할 때 부동소수 오차를 정리한다
const roundKg = (value) => Math.round(value * 1000) / 1000;

// applied: 이 줄 수량 중 기준 줄(첫 매출 줄)에서 이미 뺀 양. 포커스아웃 때 바뀐 만큼만 더 빼거나 돌려준다.
const newLine = (patch) => ({
  key: nextLineKey(),
  applied: 0,
  lineType: SETTLEMENT_LINE_TYPES.SALE,
  invoiceItemName: "",
  itemId: "",
  quantityKg: "",
  unitPrice: "",
  memo: "",
  ...patch,
});

// 저장된 정산 줄 → 입력 줄. 정산 줄이 없으면 첫 줄을 매출 줄로, 계근 품목·실중량·기존 적용 단가를 채운다.
// 저장돼 있던 줄은 기준 줄에서 이미 빠진 것으로 보고(applied = 수량), 이후 고친 만큼만 기준 줄에 반영한다.
const initialLinesOf = (row) => {
  const baseIndex = row.settlementLines.findIndex((line) => !isReturnLine(line));
  return row.settlementLines.length > 0
    ? row.settlementLines.map((line, index) =>
        newLine({
          applied: index === baseIndex ? 0 : line.quantityKg ?? 0,
          lineType: line.lineType ?? SETTLEMENT_LINE_TYPES.SALE,
          invoiceItemName: line.invoiceItemName ?? "",
          // 반품 줄 품목은 계근 품목 고정이라 입력 상태로 들고 있지 않는다
          itemId: line.lineType !== SETTLEMENT_LINE_TYPES.RETURN && line.itemId != null ? String(line.itemId) : "",
          quantityKg: toInputValue(line.quantityKg),
          unitPrice: toInputValue(line.unitPrice),
          memo: line.memo ?? "",
        })
      )
    : [
        newLine({
          invoiceItemName: row.itemName ?? "",
          itemId: row.source.itemId != null ? String(row.source.itemId) : "",
          quantityKg: toInputValue(row.netWeightKg),
          unitPrice: toInputValue(row.unitPrice),
        }),
      ];
};

// 저장할 수 없는 이유 — 서버 검증 규칙과 같게 맞춘다. recordMapped: 계근 품목 매핑 여부(반품 가능 조건)
const validationOf = (lines, recordMapped) => {
  const saleLines = lines.filter((line) => !isReturnLine(line));
  const returnLines = lines.filter(isReturnLine);
  if (lines.length === 0) return "정산 줄을 입력하세요. 모두 지우려면 [나누기 해제]를 누르세요.";
  if (saleLines.length === 0) return "반품만 입력할 수는 없습니다. 거래처가 받은 수량을 매출 줄로 함께 입력하세요.";
  if (lines.length > SETTLEMENT_MAX_LINES) return `정산 줄은 최대 ${SETTLEMENT_MAX_LINES}줄까지 입력할 수 있습니다.`;
  if (saleLines.some((line) => !line.itemId)) return "매출 줄의 품목을 선택하세요.";
  if (returnLines.length > 0 && !recordMapped) return "계근 품목이 매핑되지 않아 반품을 입력할 수 없습니다. 계근 품목을 먼저 매핑해주세요.";
  if (saleLines.some((line) => line.quantityKg === "" || line.unitPrice === "")) return "매출 줄의 수량과 단가를 입력하세요.";
  if (saleLines.some((line) => !(Number(line.quantityKg) >= 0) || !(Number(line.unitPrice) >= 0))) {
    return "수량과 단가는 0 이상이어야 합니다.";
  }
  if (returnLines.some((line) => !(Number(line.quantityKg) > 0))) return "반품 줄의 수량은 0보다 커야 합니다.";
  return "";
};

// 입력 줄 → 요청 바디. 반품 줄은 수량·메모만 보낸다(품목은 서버가 계근 품목으로 고정).
// 매출 줄 계산서 품목명은 서버 필수값이라, 비워 두면 고른 품목명을 그대로 보낸다.
const toRequestLine = (line, itemNameOf) => {
  const memo = line.memo.trim() || null;
  const quantityKg = toNumberOrNull(line.quantityKg);
  if (isReturnLine(line)) return { lineType: line.lineType, quantityKg, memo };
  return {
    lineType: line.lineType,
    invoiceItemName: line.invoiceItemName.trim() || itemNameOf(line.itemId),
    itemId: Number(line.itemId),
    quantityKg,
    unitPrice: toNumberOrNull(line.unitPrice),
    memo,
  };
};

// 계근 행 정산 줄(품목 나누기·반품) 편집 모달 상태
// transaction: 현재 거래 상세, onSaved(detail): 저장 성공(응답은 거래 상세 전체), onConflict(): 버전 충돌
export function useSettlementLines({ transaction, onSaved, onConflict }) {
  const [target, setTarget] = useState(null); // 편집 중인 계근 행
  const [lines, setLines] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const open = target != null;
  const items = useItemOptions(open);

  const itemNameOf = (itemId) => items.find((item) => String(item.id) === String(itemId))?.name ?? "";

  // 입력 줄 → 미리보기 줄(금액 포함)
  const previewLines = lines.map((line) => {
    const isReturn = isReturnLine(line);
    return {
      ...line,
      isReturn,
      amount: isReturn ? null : settlementLineAmountOf(toNumberOrNull(line.quantityKg), toNumberOrNull(line.unitPrice)),
    };
  });
  const summary = settlementSummaryOf(
    previewLines.map((line) => ({ lineType: line.lineType, quantityKg: toNumberOrNull(line.quantityKg), amount: line.amount })),
    target?.netWeightKg
  );
  // 반품 품목은 계근 품목으로 고정 — 계근 품목이 매핑돼 있어야 반품을 넣을 수 있다
  const recordMapped = target?.source.itemId != null;
  const validation = validationOf(lines, recordMapped);

  const changeLine = (key, patch) =>
    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        // 품목을 고르면 그 품목명을 계산서 품목명에 채운다.
        // 단, 계산서 품목명을 직접 다르게 고쳐 둔 경우(비어 있지도, 이전 품목명과 같지도 않음)는 그대로 둔다.
        if (patch.itemId !== undefined) {
          const previous = line.invoiceItemName.trim();
          if (!previous || previous === itemNameOf(line.itemId)) next.invoiceItemName = itemNameOf(patch.itemId);
        }
        return next;
      })
    );

  // 반품 줄 추가 — 실중량 − (매출 합계 + 기존 반품 합계)가 남아 있으면 그 수량을 제안한다.
  // 남은 수량은 아직 어느 줄에도 잡히지 않은 양이라 기준 줄에서 빼지 않는다(applied = 제안 수량).
  const addReturnLine = () => {
    if (!recordMapped) return;
    const remaining = target.netWeightKg == null ? 0 : roundKg(target.netWeightKg - summary.saleQuantityKg - summary.returnedWeightKg);
    setLines((current) => [
      ...current,
      newLine({
        lineType: SETTLEMENT_LINE_TYPES.RETURN,
        quantityKg: remaining > 0 ? String(remaining) : "",
        applied: remaining > 0 ? remaining : 0,
      }),
    ]);
  };

  // 추가한 매출·반품 줄의 수량을 입력하고 포커스아웃하면, 바뀐 만큼 기준 줄(첫 매출 줄 = 기존 품목) 수량에서 뺀다.
  // 수량을 줄이면 그만큼 기준 줄로 돌려준다. 기준 줄 수량보다 많이 뺄 수는 없다.
  const applyQuantityToBase = (key) =>
    setLines((current) => {
      const baseIndex = current.findIndex((line) => !isReturnLine(line));
      const index = current.findIndex((line) => line.key === key);
      if (baseIndex < 0 || index < 0 || index === baseIndex) return current;
      const line = current[index];
      const base = current[baseIndex];
      const baseQuantity = toNumberOrNull(base.quantityKg) ?? 0;
      let delta = roundKg((toNumberOrNull(line.quantityKg) ?? 0) - line.applied);
      if (delta > 0) delta = Math.min(delta, baseQuantity);
      if (delta === 0) return current;
      const next = [...current];
      next[baseIndex] = { ...base, quantityKg: String(roundKg(baseQuantity - delta)) };
      next[index] = { ...line, applied: roundKg(line.applied + delta) };
      return next;
    });

  // 줄 삭제 — 그 줄이 기준 줄에서 빼 갔던 수량은 기준 줄로 돌려준다
  const removeLine = (key) =>
    setLines((current) => {
      const removed = current.find((line) => line.key === key);
      const rest = current.filter((line) => line.key !== key);
      const baseIndex = rest.findIndex((line) => !isReturnLine(line));
      if (!removed?.applied || baseIndex < 0) return rest;
      const base = rest[baseIndex];
      const next = [...rest];
      next[baseIndex] = { ...base, quantityKg: String(roundKg((toNumberOrNull(base.quantityKg) ?? 0) + removed.applied)) };
      return next;
    });

  // 저장 — 그 계근 행의 정산 줄 전체를 한 번에 보낸다. nextLines=[] 이면 나누기 해제
  const submit = async (nextLines) => {
    setSaving(true);
    setError("");
    try {
      const result = await replaceSettlementLines(transaction.transactionId, target.source.mappingId, {
        version: transaction.version,
        lines: nextLines.map((line) => toRequestLine(line, itemNameOf)),
      });
      setTarget(null);
      onSaved?.(result);
    } catch (saveError) {
      if (saveError.code === VERSION_CONFLICT_CODE) {
        setTarget(null);
        onConflict?.();
      } else {
        setError(saveError.message || "정산 줄을 저장하지 못했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    openSettlement: (row) => {
      setTarget(row);
      setLines(initialLinesOf(row));
      setError("");
    },
    settlementModal: {
      open,
      target,
      items,
      lines: previewLines,
      summary,
      currency: transaction?.currency,
      saving,
      error,
      validation,
      // 반품 품목(계근 품목) 표시와 반품 줄 추가 가능 여부
      returnItemName: target?.itemName ?? null,
      returnAddable: recordMapped,
      // 이미 나눠진 계근 행만 해제할 수 있다
      removable: Boolean(target?.settlementLines.length),
      onLineChange: changeLine,
      onSaleLineAdd: () => setLines((current) => [...current, newLine()]),
      onReturnLineAdd: addReturnLine,
      onLineRemove: removeLine,
      onQuantityBlur: applyQuantityToBase,
      // 수량 자동 차감 기준 줄(첫 매출 줄)
      baseLineKey: lines.find((line) => !isReturnLine(line))?.key ?? null,
      onSave: () => {
        if (validation) {
          setError(validation);
          return;
        }
        submit(lines);
      },
      onRemoveAll: () => submit([]),
      onClose: () => setTarget(null),
    },
  };
}
