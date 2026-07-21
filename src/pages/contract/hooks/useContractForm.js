import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createContract, fetchCompanies, fetchContractDetail, updateContract } from "../api/contractApi";
import { ENUM_GROUPS } from "../api/enumsApi";
import { useEnums } from "./useEnums";
import { useToast } from "./useToast";

export const FORM_STEPS = ["기본", "단가", "품목", "확인"];

// 폼에서 쓰는 enum 그룹
const FORM_ENUMS = [
  ENUM_GROUPS.OWNER_COMPANY,
  ENUM_GROUPS.TRADE_TYPE,
  ENUM_GROUPS.PRICE_UNIT,
  ENUM_GROUPS.CONTRACT_STATUS,
  ENUM_GROUPS.PRICE_TYPE,
  ENUM_GROUPS.PRICE_SOURCE,
  ENUM_GROUPS.CALC_METHOD,
];

let tempSeq = 0;
const nextTempId = (prefix) => `${prefix}${++tempSeq}`;

// 서버 전송 필드명과 맞춤 (contractName, customerId 등)
const emptyBasic = {
  contractName: "",
  contractNo: "",
  ownerCompany: "HOJAE", // OWNER_COMPANY
  customerId: "", // 거래처 id
  tradeType: "EXPORT", // TRADE_TYPE
  priceUnit: "TON", // PRICE_UNIT
  status: "IN_PROGRESS", // CONTRACT_STATUS
  contractQuantity: "", // priceUnit 기준 수량
  startDate: "",
  endDate: "",
  memo: "",
};

const newPrice = () => ({
  tempId: nextTempId("np"),
  priceType: "PROVISIONAL", // PRICE_TYPE
  priceSource: "CALCULATED", // PRICE_SOURCE
  calcMethod: "EXPORT_STANDARD", // CALC_METHOD (CALCULATED 일 때)
  periodStart: "",
  periodEnd: "",
  fixedUnitPrice: "", // FIXED 일 때
});

const newItem = () => ({
  tempId: nextTempId("ni"),
  name: "",
  rates: {}, // priceTempId → 요율
  premiumOpen: false,
  premiums: {}, // priceTempId → 프리미엄 (펼치지 않으면 값 없음)
});

// 숫자 입력값 → number | undefined (빈 값은 미전송)
const numOrUndef = (v) => (v === "" || v == null ? undefined : Number(v));

export function useContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const { enums, labelOf } = useEnums(FORM_ENUMS);
  const isEdit = id != null;

  const [step, setStep] = useState(1);
  const [basic, setBasic] = useState(emptyBasic);
  const [prices, setPrices] = useState([]);
  const [items, setItems] = useState(() => [newItem()]);
  const [primaryItemId, setPrimaryItemId] = useState(() => items?.[0]?.tempId ?? null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);

  // 거래처 목록 (셀렉트용)
  useEffect(() => {
    fetchCompanies()
      .then((list) => setCompanies(list ?? []))
      .catch(() => {});
  }, []);

  // 수정 모드 프리필 — 헤더만 수정 가능(PUT). 단가·품목은 이 폼에서 바꾸지 않음
  useEffect(() => {
    if (!isEdit) return;
    fetchContractDetail(id)
      .then((d) => {
        setBasic({
          contractName: d.contractName ?? "",
          contractNo: d.contractNo ?? "",
          ownerCompany: d.ownerCompany ?? "HOJAE",
          customerId: d.customerId != null ? String(d.customerId) : "",
          tradeType: d.tradeType ?? "EXPORT",
          priceUnit: d.priceUnit ?? "TON",
          status: d.status ?? "IN_PROGRESS",
          contractQuantity: d.contractQuantity != null ? String(d.contractQuantity) : "",
          startDate: d.startDate ?? "",
          endDate: d.endDate ?? "",
          memo: d.memo ?? "",
        });
      })
      .catch((e) => showToast("error", e.message || "계약을 불러오지 못했습니다"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  // ── 스텝 1: 기본 ──
  const handleBasicChange = (field, value) => {
    if (field === "contractQuantity" && value !== "" && Number(value) < 0) return;
    setBasic((prev) => ({ ...prev, [field]: value }));
  };

  // ── 스텝 2: 단가 (추가형) ──
  const handleAddPrice = () => setPrices((prev) => [...prev, newPrice()]);

  const handleRemovePrice = (tempId) => {
    setPrices((prev) => prev.filter((p) => p.tempId !== tempId));
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
    if (field === "fixedUnitPrice" && value !== "" && Number(value) < 0) return;
    setPrices((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, [field]: value } : p))
    );
  };

  // ── 스텝 3: 품목 ──
  const handleAddItem = () => {
    const item = newItem();
    setItems((prev) => [...prev, item]);
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
        i.tempId === tempId ? { ...i, rates: { ...i.rates, [priceTempId]: value } } : i
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

  // ── 스텝 이동 ──
  const goPrev = () => setStep((s) => Math.max(1, s - 1));
  const goNext = () => {
    if (step === 1 && !basic.contractName.trim()) {
      showToast("error", "계약명을 입력하세요");
      return;
    }
    setStep((s) => Math.min(FORM_STEPS.length, s + 1));
  };

  // ── 저장 — ContractCreateRequest 조립 ──
  const buildCreateRequest = () => {
    const priceIndexOf = {}; // tempId → prices 배열 인덱스
    prices.forEach((p, idx) => (priceIndexOf[p.tempId] = idx));

    return {
      ownerCompany: basic.ownerCompany,
      contractName: basic.contractName.trim(),
      contractNo: basic.contractNo || undefined,
      customerId: numOrUndef(basic.customerId),
      tradeType: basic.tradeType,
      priceUnit: basic.priceUnit,
      contractQuantity: numOrUndef(basic.contractQuantity),
      startDate: basic.startDate || undefined,
      endDate: basic.endDate || undefined,
      status: basic.status,
      memo: basic.memo || undefined,
      // 단가들
      prices: prices.map((p) => ({
        priceType: p.priceType,
        priceSource: p.priceSource,
        calcMethod: p.priceSource === "CALCULATED" ? p.calcMethod : undefined,
        periodStart: p.periodStart || undefined,
        periodEnd: p.periodEnd || undefined,
        fixedUnitPrice: p.priceSource === "FIXED" ? numOrUndef(p.fixedUnitPrice) : undefined,
      })),
      // 품목들 — 품목별 요율·프리미엄을 prices[]로 (priceIndex 참조)
      items: items.map((it) => ({
        itemName: it.name,
        primary: primaryItemId === it.tempId,
        prices: prices
          .map((p) => {
            const rate = it.rates[p.tempId];
            const premium = it.premiums[p.tempId];
            const hasRate = rate !== "" && rate != null;
            const hasPremium = premium !== "" && premium != null;
            if (!hasRate && !hasPremium) return null; // 미지정 단가는 서버가 요율1·프리미엄0
            return {
              priceIndex: priceIndexOf[p.tempId],
              rate: hasRate ? Number(rate) : undefined,
              premium: hasPremium ? Number(premium) : undefined,
            };
          })
          .filter(Boolean),
      })),
    };
  };

  // 수정 요청 — 헤더 필드만 (PUT 은 품목·단가를 바꾸지 않음)
  const buildUpdateRequest = () => ({
    ownerCompany: basic.ownerCompany,
    contractName: basic.contractName.trim(),
    contractNo: basic.contractNo || undefined,
    customerId: numOrUndef(basic.customerId),
    tradeType: basic.tradeType,
    priceUnit: basic.priceUnit,
    contractQuantity: numOrUndef(basic.contractQuantity),
    startDate: basic.startDate || undefined,
    endDate: basic.endDate || undefined,
    status: basic.status,
    memo: basic.memo || undefined,
  });

  const handleConfirmSave = async () => {
    if (submitting) return;
    if (!basic.contractName.trim()) {
      showToast("error", "계약명을 입력하세요");
      setSaveModalOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateContract(id, buildUpdateRequest());
        setSaveModalOpen(false);
        showToast("success", "저장되었습니다");
        setTimeout(() => navigate(`/contract/${id}`), 600);
        return;
      }
      await createContract(buildCreateRequest());
      setSaveModalOpen(false);
      showToast("success", "저장되었습니다");
      setTimeout(() => navigate("/contract"), 600);
    } catch (e) {
      // 서버 검증 오류 메시지 표시 (계약명 누락·단가 필수값 누락 등)
      showToast("error", e.message || "저장에 실패했습니다");
      setSaveModalOpen(false);
    } finally {
      setSubmitting(false);
    }
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
    basicStep: {
      basic,
      onChange: handleBasicChange,
      companies,
      ownerOptions: enums[ENUM_GROUPS.OWNER_COMPANY] ?? [],
      tradeOptions: enums[ENUM_GROUPS.TRADE_TYPE] ?? [],
      unitOptions: enums[ENUM_GROUPS.PRICE_UNIT] ?? [],
      statusOptions: enums[ENUM_GROUPS.CONTRACT_STATUS] ?? [],
    },
    pricesStep: {
      prices,
      onAdd: handleAddPrice,
      onRemove: handleRemovePrice,
      onChange: handlePriceChange,
      priceTypeOptions: (enums[ENUM_GROUPS.PRICE_TYPE] ?? []).filter(
        (option) => option.value !== "SETTLEMENT"
      ),
      sourceOptions: enums[ENUM_GROUPS.PRICE_SOURCE] ?? [],
      calcMethodOptions: enums[ENUM_GROUPS.CALC_METHOD] ?? [],
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
      priceTypeLabel: (v) => labelOf(ENUM_GROUPS.PRICE_TYPE, v),
    },
    confirmStep: {
      basic,
      prices,
      items,
      primaryItemId,
      companies,
      labelOf,
    },
    saveModal: {
      open: saveModalOpen,
      submitting,
      onConfirm: handleConfirmSave,
      onCancel: () => setSaveModalOpen(false),
    },
    toast,
  };
}
