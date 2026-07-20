import { apiFetch } from "../../../utils/api";

// 공통 응답 처리 — JSON 본문 반환, 실패 시 서버 메시지를 담아 throw
const asJson = async (res) => {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.clone().json();
      if (body?.message) message = body.message;
    } catch {
      const text = await res.text().catch(() => "");
      if (text) message = text;
    }
    throw new Error(message);
  }
  return res.json();
};

// 참고: 변경(POST/PUT/DELETE)·재계산 응답은 CommonResponse{ message, data } 로 감싸져 온다.
//       조회(GET)는 감싸지 않은 원본 스키마 그대로.

// ─── 계약 ──────────────────────────────────────────────────────────────────
// 목록 조회 (page 1-기반). 값이 없는 필터는 파라미터에서 제외
export const fetchContracts = async ({
  ownerCompany,
  contractName,
  status,
  tradeType,
  customerId,
  page,
  size,
} = {}) => {
  const params = new URLSearchParams();
  if (ownerCompany) params.set("ownerCompany", ownerCompany);
  if (contractName) params.set("contractName", contractName);
  if (status) params.set("status", status);
  if (tradeType) params.set("tradeType", tradeType);
  if (customerId != null && customerId !== "") params.set("customerId", String(customerId));
  params.set("page", String(page));
  params.set("size", String(size));
  return asJson(await apiFetch(`/api/contracts?${params.toString()}`));
};

// 상세 조회 (기본 정보 + 품목). 단가는 /prices 로 별도 조회
export const fetchContractDetail = async (contractId) =>
  asJson(await apiFetch(`/api/contracts/${contractId}`));

// 계약의 전체 단가 상세 (기간·기준값·확정여부 + 품목별 최종단가)
export const fetchContractPrices = async (contractId) =>
  asJson(await apiFetch(`/api/contracts/${contractId}/prices`));

// 계약 생성 → { message, data: { contractId, itemIds, priceIds } }
export const createContract = async (body) =>
  asJson(
    await apiFetch(`/api/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

// 계약 수정 (헤더만) → { message }
export const updateContract = async (contractId, body) =>
  asJson(
    await apiFetch(`/api/contracts/${contractId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

// 계약 삭제 (soft delete) → { message }
export const deleteContract = async (contractId) =>
  asJson(await apiFetch(`/api/contracts/${contractId}`, { method: "DELETE" }));

// ─── 계약 단가 ──────────────────────────────────────────────────────────────
// 단가 확정 → { message }
export const confirmPrice = async (priceId) =>
  asJson(await apiFetch(`/api/contracts/prices/${priceId}/confirm`, { method: "POST" }));

// 선택한 단가 1건 즉시 재계산 → { message, data: { calcDate, recalculated } }
export const recalcPrice = async (priceId) =>
  asJson(await apiFetch(`/api/contracts/prices/${priceId}/recalc`, { method: "POST" }));

// 당일 단가 수동 재계산 → { message, data: { calcDate, recalculated } }
export const recalcPrices = async () =>
  asJson(await apiFetch(`/api/contracts/prices/recalc`, { method: "POST" }));

// ─── 거래 내역 ──────────────────────────────────────────────────────────────
// 거래 내역 조회 (납품일 순)
export const fetchTransactions = async (contractId) =>
  asJson(await apiFetch(`/api/contracts/${contractId}/transactions`));

// 거래 등록 (결제 정보 포함 가능. 금액은 서버 계산)
export const createTransaction = async (contractId, body) =>
  asJson(
    await apiFetch(`/api/contracts/${contractId}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

// 기존 거래 내용 수정 (결제 정보 제외)
export const updateTransaction = async (contractId, transactionId, body) =>
  asJson(
    await apiFetch(`/api/contracts/${contractId}/transactions/${transactionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

// 마지막 거래의 정산 단가·정산금액 미리 계산 (저장하지 않음)
export const calculateSettlement = async (contractId, body) =>
  asJson(
    await apiFetch(`/api/contracts/${contractId}/transactions/settlement/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

// 기존 거래의 실제 결제 정보 등록·수정
export const updateTransactionPayment = async (contractId, transactionId, body) =>
  asJson(
    await apiFetch(`/api/contracts/${contractId}/transactions/${transactionId}/payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

// ─── 거래처 ────────────────────────────────────────────────────────────────
// 거래처(회사) 셀렉트용 목록 → [{ id, name }]
export const fetchCompanies = async (keyword) => {
  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  const qs = params.toString();
  return asJson(await apiFetch(`/api/companies${qs ? `?${qs}` : ""}`));
};
