import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MOCK_CONTRACTS } from "../mockData";
import { useToast } from "./useToast";

export const FORM_STEPS = ["기본", "단가", "품목", "확인"];

let tempSeq = 0;
const nextTempId = (prefix) => `${prefix}${++tempSeq}`;

const emptyBasic = {
  contractNo: "",
  customer: "",
  startDate: "",
  endDate: "",
  tradeType: "수출",
  priceUnit: "TON",
};

const newPrice = () => ({
  tempId: nextTempId("np"),
  type: "가단가",
  periodStart: "",
  periodEnd: "",
  formulaId: "PERIOD_AVG",
  fixedPrice: "",
});

const newItem = () => ({
  tempId: nextTempId("ni"),
  name: "",
  rates: {}, // priceTempId → 요율(%)
  premiumOpen: false,
  premiums: {}, // priceTempId → 프리미엄 (펼치지 않으면 값 없음)
});

// 기존 계약 → 폼 상태 (수정 모드 프리필)
const contractToForm = (contract) => {
  const prices = contract.prices.map((p) => ({
    tempId: p.id,
    type: p.type,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    formulaId: p.formulaId,
    fixedPrice: p.fixedPrice ?? "",
  }));
  const items = contract.items.map((item) => {
    const rates = {};
    const premiums = {};
    let premiumOpen = false;
    contract.prices.forEach((p) => {
      const option = item.options?.[p.id];
      if (option?.rate != null) rates[p.id] = option.rate;
      if (option?.premium != null) {
        premiums[p.id] = option.premium;
        premiumOpen = true;
      }
    });
    return { tempId: item.id, name: item.name, rates, premiumOpen, premiums };
  });
  const primary = contract.items.find((i) => i.isPrimary) ?? contract.items[0];
  return {
    basic: {
      contractNo: contract.contractNo,
      customer: contract.company,
      startDate: contract.startDate,
      endDate: contract.endDate,
      tradeType: contract.tradeType,
      priceUnit: contract.priceUnit,
    },
    prices,
    items,
    primaryItemId: primary?.id ?? null,
  };
};

export function useContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const isEdit = id != null;

  const [step, setStep] = useState(1);
  const [basic, setBasic] = useState(emptyBasic);
  const [prices, setPrices] = useState([]);
  const [items, setItems] = useState(() => {
    const first = newItem();
    return [first];
  });
  const [primaryItemId, setPrimaryItemId] = useState(() => items?.[0]?.tempId ?? null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // 수정 모드 — 기존 값 채워 재사용 (TODO: API 연동 시 상세 조회로 교체)
  useEffect(() => {
    if (!isEdit) return;
    const found = MOCK_CONTRACTS.find((c) => String(c.id) === String(id));
    if (!found) return;
    const form = contractToForm(found);
    setBasic(form.basic);
    setPrices(form.prices);
    setItems(form.items);
    setPrimaryItemId(form.primaryItemId);
  }, [isEdit, id]);

  // ── 스텝 1: 기본 ──
  const handleBasicChange = (field, value) =>
    setBasic((prev) => ({ ...prev, [field]: value }));

  // ── 스텝 2: 단가 (추가형) ──
  const handleAddPrice = () => setPrices((prev) => [...prev, newPrice()]);

  const handleRemovePrice = (tempId) => {
    setPrices((prev) => prev.filter((p) => p.tempId !== tempId));
    // 품목 행에 남은 해당 단가의 요율·프리미엄도 제거
    setItems((prev) =>
      prev.map((item) => {
        const rates = { ...item.rates };
        const premiums = { ...item.premiums };
        delete rates[tempId];
        delete premiums[tempId];
        return { ...item, rates, premiums };
      })
    );
  };

  const handlePriceChange = (tempId, field, value) => {
    // 고정 단가 음수 입력 방지 (0은 허용)
    if (field === "fixedPrice" && value !== "" && Number(value) < 0) return;
    setPrices((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, [field]: value } : p))
    );
  };

  // ── 스텝 3: 품목 (테이블 · 행 추가) ──
  const handleAddItem = () => {
    const item = newItem();
    setItems((prev) => [...prev, item]);
    // 첫 번째 품목이 기본 대표
    if (items.length === 0) setPrimaryItemId(item.tempId);
  };

  const handleRemoveItem = (tempId) => {
    const rest = items.filter((i) => i.tempId !== tempId);
    setItems(rest);
    if (primaryItemId === tempId) setPrimaryItemId(rest[0]?.tempId ?? null);
  };

  const handleItemChange = (tempId, field, value) =>
    setItems((prev) =>
      prev.map((i) => (i.tempId === tempId ? { ...i, [field]: value } : i))
    );

  const handleItemRateChange = (tempId, priceTempId, value) => {
    if (value !== "" && Number(value) < 0) return;
    setItems((prev) =>
      prev.map((i) =>
        i.tempId === tempId
          ? { ...i, rates: { ...i.rates, [priceTempId]: value } }
          : i
      )
    );
  };

  const handleItemPremiumChange = (tempId, priceTempId, value) => {
    if (value !== "" && Number(value) < 0) return;
    setItems((prev) =>
      prev.map((i) =>
        i.tempId === tempId
          ? { ...i, premiums: { ...i.premiums, [priceTempId]: value } }
          : i
      )
    );
  };

  const handleTogglePremium = (tempId) =>
    setItems((prev) =>
      prev.map((i) =>
        i.tempId === tempId ? { ...i, premiumOpen: !i.premiumOpen } : i
      )
    );

  // ── 스텝 이동 / 저장 ──
  const goPrev = () => setStep((s) => Math.max(1, s - 1));
  const goNext = () => setStep((s) => Math.min(FORM_STEPS.length, s + 1));

  const handleConfirmSave = () => {
    // TODO: API 연동 시 등록/수정 요청 → 서버 검증 오류는 토스트로 표시
    setSaveModalOpen(false);
    showToast("success", "저장되었습니다");
    setTimeout(() => navigate("/contract"), 600);
  };

  return {
    isEdit,
    stepper: { step, steps: FORM_STEPS },
    nav: {
      step,
      totalSteps: FORM_STEPS.length,
      onPrev: goPrev,
      onNext: goNext,
      onSave: () => setSaveModalOpen(true),
      onCancel: () => navigate(-1),
    },
    basicStep: { basic, onChange: handleBasicChange },
    pricesStep: {
      prices,
      onAdd: handleAddPrice,
      onRemove: handleRemovePrice,
      onChange: handlePriceChange,
    },
    itemsStep: {
      items,
      prices,
      primaryItemId,
      onAdd: handleAddItem,
      onRemove: handleRemoveItem,
      onItemChange: handleItemChange,
      onRateChange: handleItemRateChange,
      onPremiumChange: handleItemPremiumChange,
      onTogglePremium: handleTogglePremium,
      onSetPrimary: setPrimaryItemId,
    },
    confirmStep: { basic, prices, items, primaryItemId },
    saveModal: {
      open: saveModalOpen,
      onConfirm: handleConfirmSave,
      onCancel: () => setSaveModalOpen(false),
    },
    toast,
  };
}
