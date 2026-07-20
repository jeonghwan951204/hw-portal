import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  calculateSettlement,
  confirmPrice,
  createTransaction,
  deleteContract,
  fetchCompanies,
  fetchContractDetail,
  fetchContractPrices,
  fetchTransactions,
  recalcPrice,
  updateTransaction,
  updateTransactionPayment,
} from "../api/contractApi";
import { ENUM_GROUPS } from "../api/enumsApi";
import { useEnums } from "./useEnums";
import { useToast } from "./useToast";

const DETAIL_ENUMS = [
  ENUM_GROUPS.OWNER_COMPANY,
  ENUM_GROUPS.CONTRACT_STATUS,
  ENUM_GROUPS.PRICE_TYPE,
  ENUM_GROUPS.PAID_CURRENCY,
];

const today = () => new Date().toISOString().slice(0, 10);
const numOrUndef = (v) => (v === "" || v == null ? undefined : Number(v));
const emptyTxForm = () => ({
  date: today(),
  itemId: "",
  priceType: "",
  quantity: "",
  finalSettlement: false,
  withPayment: false,
  paidAmount: "",
  paidForeign: "",
  paidExchange: "",
  paidDate: "",
  paymentMemo: "",
});

export function useContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const { enums, labelOf } = useEnums(DETAIL_ENUMS);

  const [detail, setDetail] = useState(null);
  const [contractPrices, setContractPrices] = useState([]); // PriceDetailResponse[]
  const [transactions, setTransactions] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("price");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [recalculatingId, setRecalculatingId] = useState(null);

  const [txForm, setTxForm] = useState(emptyTxForm);
  const [txFormOpen, setTxFormOpen] = useState(false);
  const [submittingTx, setSubmittingTx] = useState(false);
  const [settlementPreview, setSettlementPreview] = useState(null);
  const [settlementCalculating, setSettlementCalculating] = useState(false);
  const [settlementError, setSettlementError] = useState("");
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [submittingPaymentId, setSubmittingPaymentId] = useState(null);
  const [expandedEditId, setExpandedEditId] = useState(null);
  const [submittingEditId, setSubmittingEditId] = useState(null);

  // 계약의 전체 단가 상세(기간·확정·기준값 + 품목별 최종단가) 로드
  const loadPrices = async () => {
    const prices = (await fetchContractPrices(id).catch(() => [])) ?? [];
    setContractPrices(prices);
  };

  const loadTransactions = async () => {
    const txs = (await fetchTransactions(id).catch(() => [])) ?? [];
    setTransactions(txs);
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const d = await fetchContractDetail(id);
        if (!alive) return;
        setDetail(d);
        await Promise.all([loadPrices(), loadTransactions()]);
        if (d.customerId != null) {
          fetchCompanies()
            .then((list) => {
              if (!alive) return;
              const found = (list ?? []).find((c) => String(c.id) === String(d.customerId));
              setCompanyName(found?.name ?? "");
            })
            .catch(() => {});
        }
      } catch {
        if (alive) setDetail(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isExport = detail?.tradeType === "EXPORT";
  const currency = isExport ? "USD" : "원";
  const unitSuffix = detail?.priceUnit === "TON" ? "ton" : "kg";
  const unitHint = `${currency}/${unitSuffix}`;

  const contractVM = detail
    ? {
        contractId: detail.contractId,
        name: detail.contractName,
        contractNo: detail.contractNo,
        ownerLabel: labelOf(ENUM_GROUPS.OWNER_COMPANY, detail.ownerCompany),
        status: labelOf(ENUM_GROUPS.CONTRACT_STATUS, detail.status),
        company: companyName,
        startDate: detail.startDate,
        endDate: detail.endDate,
        contractQuantity: detail.contractQuantity,
        priceUnit: detail.priceUnit,
        memo: detail.memo,
      }
    : null;

  // 컬럼(단가) 정의
  const columns = useMemo(
    () =>
      contractPrices.map((price) => ({
        priceId: price.priceId,
        priceType: price.priceType,
        label:
          (enums[ENUM_GROUPS.PRICE_TYPE] ?? []).find(
            (option) => option.value === price.priceType
          )?.label ?? price.priceType,
      })),
    [contractPrices, enums]
  );

  const rows = useMemo(() => {
    const rowMap = new Map();
    (detail?.items ?? []).forEach((item) => {
      rowMap.set(item.itemId, {
        itemId: item.itemId,
        itemName: item.itemName,
        primary: item.primary,
        cells: {},
      });
    });
    contractPrices.forEach((price) => {
      (price.items ?? []).forEach((item) => {
        const row = rowMap.get(item.itemId) ?? {
          itemId: item.itemId,
          itemName: item.itemName,
          primary: item.primary,
          cells: {},
        };
        row.cells[price.priceId] = {
          rate: item.rate,
          premium: item.premium,
          unitPrice: item.finalUnitPrice,
        };
        rowMap.set(item.itemId, row);
      });
    });
    return [...rowMap.values()];
  }, [contractPrices, detail]);

  // 단가별 기간 줄 (확정 여부·기준 LME/환율)
  const priceLines = useMemo(
    () =>
      contractPrices.map((price) => ({
        priceId: price.priceId,
        priceType: price.priceType,
        label:
          (enums[ENUM_GROUPS.PRICE_TYPE] ?? []).find(
            (option) => option.value === price.priceType
          )?.label ?? price.priceType,
        periodStart: price.periodStart,
        periodEnd: price.periodEnd,
        confirmed: !!price.confirmedAt,
        avgLme: price.avgLmePrice,
        avgExchange: price.avgExchange,
      })),
    [contractPrices, enums]
  );

  // 거래 단가유형 옵션 — 계약에 등록된 유형 + 거래 전용 정산가
  const txPriceTypeOptions = useMemo(
    () => {
      const options = columns
        .filter((c) => c.priceType !== "SETTLEMENT")
        .filter((c, i, arr) => arr.findIndex((x) => x.priceType === c.priceType) === i)
        .map((c) => ({ value: c.priceType, label: c.label }));
      const settlement = (enums[ENUM_GROUPS.PRICE_TYPE] ?? []).find(
        (option) => option.value === "SETTLEMENT"
      );
      return settlement ? [...options, settlement] : options;
    },
    [columns, enums]
  );

  // 품목 × 단가유형 → 산정단가(unitPrice) 조회맵
  const unitPriceMap = useMemo(() => {
    const map = {};
    contractPrices.forEach((price) => {
      (price.items ?? []).forEach((item) => {
        if (!map[item.itemId]) map[item.itemId] = {};
        map[item.itemId][price.priceType] = item.finalUnitPrice;
      });
    });
    return map;
  }, [contractPrices]);

  const derivedUnitPrice =
    txForm.itemId && txForm.priceType ? unitPriceMap[txForm.itemId]?.[txForm.priceType] : undefined;

  // 마지막 거래 선택 시 품목·수량을 기준으로 정산가 미리보기
  useEffect(() => {
    const quantity = Number(txForm.quantity);
    if (!txForm.finalSettlement || !txForm.itemId || !Number.isFinite(quantity) || quantity <= 0) {
      setSettlementPreview(null);
      setSettlementCalculating(false);
      setSettlementError("");
      return undefined;
    }

    setSettlementPreview(null);
    setSettlementCalculating(true);
    setSettlementError("");
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        const result = await calculateSettlement(id, {
          itemId: Number(txForm.itemId),
          quantity,
        });
        if (alive) setSettlementPreview(result);
      } catch (e) {
        if (!alive) return;
        setSettlementPreview(null);
        setSettlementError(e.message || "정산가를 계산하지 못했습니다");
      } finally {
        if (alive) setSettlementCalculating(false);
      }
    }, 300);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id, txForm.finalSettlement, txForm.itemId, txForm.quantity]);

  const itemNameById = useMemo(() => {
    const map = {};
    (detail?.items ?? []).forEach((it) => (map[it.itemId] = it.itemName));
    return map;
  }, [detail]);

  const txVM = useMemo(
    () =>
      transactions.map((t) => ({
        ...t,
        itemName: itemNameById[t.itemId] ?? "-",
        priceTypeLabel: labelOf(ENUM_GROUPS.PRICE_TYPE, t.priceType),
        paid: t.paidForeign != null || t.paidAmount != null || t.paidDate != null,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, itemNameById]
  );

  // ── 거래 등록 ──
  const handleTxFormChange = (field, value) => {
    if (["quantity", "paidAmount", "paidForeign", "paidExchange"].includes(field) && value !== "" && Number(value) < 0)
      return;
    setTxForm((prev) => {
      if (field === "priceType") {
        let finalSettlement = prev.finalSettlement;
        if (value === "SETTLEMENT") finalSettlement = true;
        else if (prev.priceType === "SETTLEMENT") finalSettlement = false;
        return {
          ...prev,
          priceType: value,
          finalSettlement,
        };
      }
      if (field === "finalSettlement") {
        let priceType = prev.priceType;
        if (value) priceType = "SETTLEMENT";
        else if (prev.priceType === "SETTLEMENT") priceType = "";
        return {
          ...prev,
          finalSettlement: value,
          priceType,
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmitTransaction = async () => {
    if (submittingTx) return;
    if (!txForm.date || !txForm.itemId || !txForm.priceType || txForm.quantity === "") {
      showToast("error", "납품일·품목·단가유형·수량을 모두 입력하세요");
      return;
    }
    if (txForm.finalSettlement && !settlementPreview) {
      showToast("error", settlementError || "정산가 계산 결과를 확인하세요");
      return;
    }
    // 일반 거래는 산정단가 필요 (마지막 정산은 서버가 계산)
    if (!txForm.finalSettlement && (derivedUnitPrice == null)) {
      showToast("error", "선택한 품목·단가유형의 산정단가가 아직 없습니다");
      return;
    }
    const body = {
      itemId: Number(txForm.itemId),
      transactionDate: txForm.date,
      quantity: Number(txForm.quantity),
      priceType: txForm.priceType,
      isFinalSettlement: txForm.finalSettlement || undefined,
      unitPrice: txForm.finalSettlement ? undefined : Number(derivedUnitPrice),
    };
    if (txForm.withPayment) {
      body.paidCurrency = isExport ? "USD" : "KRW";
      body.paidAmount = numOrUndef(txForm.paidAmount);
      body.paidDate = txForm.paidDate || undefined;
      body.paymentMemo = txForm.paymentMemo || undefined;
      if (isExport) {
        body.paidForeign = numOrUndef(txForm.paidForeign);
        body.paidExchange = numOrUndef(txForm.paidExchange);
      }
    }
    setSubmittingTx(true);
    try {
      await createTransaction(id, body);
      await loadTransactions();
      setTxForm(emptyTxForm());
      setTxFormOpen(false);
      showToast("success", "거래가 등록되었습니다");
    } catch (e) {
      showToast("error", e.message || "거래 등록에 실패했습니다");
    } finally {
      setSubmittingTx(false);
    }
  };

  // ── 기존 거래 결제 등록·수정 ──
  const handleSavePayment = async (transactionId, body) => {
    if (submittingPaymentId) return;
    setSubmittingPaymentId(transactionId);
    try {
      await updateTransactionPayment(id, transactionId, body);
      await loadTransactions();
      setExpandedPaymentId(null);
      showToast("success", "결제 정보가 저장되었습니다");
    } catch (e) {
      showToast("error", e.message || "결제 정보 저장에 실패했습니다");
    } finally {
      setSubmittingPaymentId(null);
    }
  };

  // ── 기존 거래 내용 수정 ──
  const handleUpdateTransaction = async (transactionId, body) => {
    if (submittingEditId) return;
    setSubmittingEditId(transactionId);
    try {
      await updateTransaction(id, transactionId, body);
      await loadTransactions();
      setExpandedEditId(null);
      showToast("success", "거래 내역이 수정되었습니다");
    } catch (e) {
      showToast("error", e.message || "거래 내역 수정에 실패했습니다");
    } finally {
      setSubmittingEditId(null);
    }
  };

  // ── 단가 확정 ──
  const handleConfirmPrice = async (priceId) => {
    if (confirmingId) return;
    setConfirmingId(priceId);
    try {
      await confirmPrice(priceId);
      await loadPrices();
      showToast("success", "단가가 확정되었습니다");
    } catch (e) {
      showToast("error", e.message || "단가 확정에 실패했습니다");
    } finally {
      setConfirmingId(null);
    }
  };

  // ── 단가 재계산 ──
  const handleRecalcPrice = async (priceId) => {
    if (recalculatingId) return;
    setRecalculatingId(priceId);
    try {
      await recalcPrice(priceId);
      await loadPrices();
      showToast("success", "단가가 재계산되었습니다");
    } catch (e) {
      showToast("error", e.message || "단가 재계산에 실패했습니다");
    } finally {
      setRecalculatingId(null);
    }
  };

  // ── 삭제 ──
  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteContract(id);
      setDeleteModalOpen(false);
      showToast("success", "삭제되었습니다");
      setTimeout(() => navigate("/contract"), 500);
    } catch (e) {
      showToast("error", e.message || "삭제에 실패했습니다");
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return {
    loading,
    contract: contractVM,
    header: {
      contract: contractVM,
      onEdit: () => navigate(`/contract/${id}/edit`),
      onDelete: () => setDeleteModalOpen(true),
      onBack: () => navigate("/contract"),
    },
    tabs: { activeTab, onTabChange: setActiveTab },
    priceTab: {
      rows,
      columns,
      unitHint,
      priceLines,
      onConfirm: handleConfirmPrice,
      confirmingId,
      onRecalc: handleRecalcPrice,
      recalculatingId,
    },
    txTab: {
      transactions: txVM,
      isExport,
      unitHint,
      form: {
        open: txFormOpen,
        onToggle: () => setTxFormOpen((v) => !v),
        values: txForm,
        onChange: handleTxFormChange,
        itemOptions: detail?.items ?? [],
        priceTypeOptions: txPriceTypeOptions,
        derivedUnitPrice,
        settlementPreview,
        settlementCalculating,
        settlementError,
        submitting: submittingTx,
        onSubmit: handleSubmitTransaction,
      },
      payment: {
        expandedId: expandedPaymentId,
        onToggle: (transactionId) => {
          setExpandedEditId(null);
          setExpandedPaymentId((current) => (current === transactionId ? null : transactionId));
        },
        submittingId: submittingPaymentId,
        onSave: handleSavePayment,
      },
      edit: {
        expandedId: expandedEditId,
        onToggle: (transactionId) => {
          setExpandedPaymentId(null);
          setExpandedEditId((current) => (current === transactionId ? null : transactionId));
        },
        submittingId: submittingEditId,
        onSave: handleUpdateTransaction,
        itemOptions: detail?.items ?? [],
        priceTypeOptions: txPriceTypeOptions,
      },
    },
    deleteModal: {
      open: deleteModalOpen,
      onConfirm: handleConfirmDelete,
      onCancel: () => setDeleteModalOpen(false),
    },
    toast,
  };
}
