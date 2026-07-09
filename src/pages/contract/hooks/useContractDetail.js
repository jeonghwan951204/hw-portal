import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isSettlementVisible } from "../constants";
import { MOCK_CONTRACTS } from "../mockData";
import { useToast } from "./useToast";

const today = () => new Date().toISOString().slice(0, 10);

export function useContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("price"); // price | tx

  // 임시 조회 — TODO: API 연동 시 apiFetch로 교체
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const found = MOCK_CONTRACTS.find((c) => String(c.id) === String(id));
      // 거래 추가 등 화면 조작을 위해 복사본을 상태로 보관 (연동 전 임시)
      setContract(found ? JSON.parse(JSON.stringify(found)) : null);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  const settlementVisible = contract ? isSettlementVisible(contract) : false;

  // 거래 입력에서 선택 가능한 단가유형 — 정산가는 확정가 확정 시에만 노출
  const priceTypeOptions = useMemo(() => {
    if (!contract) return [];
    const types = contract.prices
      .filter((p) => p.type !== "정산가" || settlementVisible)
      .map((p) => p.type);
    return [...new Set(types)];
  }, [contract, settlementVisible]);

  // ── 거래 바로 입력 (확인 모달 없이 저장 후 토스트) ──
  const emptyTxInput = { date: today(), itemId: "", priceType: "", quantity: "" };
  const [txInput, setTxInput] = useState(emptyTxInput);
  const [mobileTxFormOpen, setMobileTxFormOpen] = useState(false);

  const handleTxInputChange = (field, value) => {
    // 수량 음수 입력 방지 (0은 허용)
    if (field === "quantity" && value !== "" && Number(value) < 0) return;
    setTxInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTransaction = () => {
    if (!txInput.date || !txInput.itemId || !txInput.priceType || txInput.quantity === "") {
      showToast("error", "날짜·품목·단가유형·수량을 모두 입력하세요");
      return;
    }
    const item = contract.items.find((i) => i.id === txInput.itemId);
    const price = contract.prices.find((p) => p.type === txInput.priceType);
    // 단가·총금액은 서버가 계산해 반환 — 연동 전 임시로 품목 옵션 값을 사용
    const unitPrice = item?.options?.[price?.id]?.value ?? price?.fixedPrice ?? 0;
    const quantity = Number(txInput.quantity);
    const newTx = {
      id: `t${Date.now()}`,
      date: txInput.date,
      itemName: item?.name ?? "-",
      priceType: txInput.priceType,
      quantity,
      unitPrice,
      totalAmount: unitPrice * quantity,
      paid: false,
      payment: null,
    };
    setContract((prev) => ({ ...prev, transactions: [...prev.transactions, newTx] }));
    setTxInput(emptyTxInput);
    setMobileTxFormOpen(false);
    showToast("success", "거래가 추가되었습니다");
  };

  // ── 결제 입력 (미결제 행 클릭 → 펼침, 저장 후 토스트) ──
  const [expandedTxId, setExpandedTxId] = useState(null);

  const handleToggleExpand = (tx) => {
    if (tx.paid) return;
    setExpandedTxId((prev) => (prev === tx.id ? null : tx.id));
  };

  const handleSavePayment = (txId, payment) => {
    // TODO: API 연동 시 서버 저장 후 응답으로 갱신
    setContract((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === txId ? { ...t, paid: true, payment } : t
      ),
    }));
    setExpandedTxId(null);
    showToast("success", "결제가 저장되었습니다");
  };

  // ── 삭제 (확인 모달 → 서버 요청) ──
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleConfirmDelete = () => {
    // TODO: API 연동 시 삭제 요청 후 이동
    setDeleteModalOpen(false);
    navigate("/contract");
  };

  return {
    loading,
    contract,
    header: {
      contract,
      onEdit: () => navigate(`/contract/${id}/edit`),
      onDelete: () => setDeleteModalOpen(true),
      onBack: () => navigate("/contract"),
    },
    tabs: { activeTab, onTabChange: setActiveTab },
    priceTab: { contract, settlementVisible },
    txTab: {
      contract,
      settlementVisible,
      priceTypeOptions,
      txInput,
      onTxInputChange: handleTxInputChange,
      onAddTransaction: handleAddTransaction,
      mobileTxFormOpen,
      onToggleMobileTxForm: () => setMobileTxFormOpen((v) => !v),
      expandedTxId,
      onToggleExpand: handleToggleExpand,
      onSavePayment: handleSavePayment,
    },
    deleteModal: {
      open: deleteModalOpen,
      onConfirm: handleConfirmDelete,
      onCancel: () => setDeleteModalOpen(false),
    },
    toast,
  };
}
