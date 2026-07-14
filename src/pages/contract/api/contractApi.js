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

// 문자열(text) 본문을 반환하는 엔드포인트용 (단가 확정 등)
const asText = async (res) => {
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return text;
};

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

// 상세 조회 (기본 정보 + 품목 + 단가 목록)
export const fetchContractDetail = async (contractId) =>
  asJson(await apiFetch(`/api/contracts/${contractId}`));

// 계약 생성
export const createContract = async (body) =>
  asJson(
    await apiFetch(`/api/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

// ─── 계약 단가 ──────────────────────────────────────────────────────────────
// 단가 상세 (품목별 최종가 + 기준 LME/환율). 상세 품목 표의 컬럼 값 출처
export const fetchPriceDetail = async (priceId) =>
  asJson(await apiFetch(`/api/contracts/prices/${priceId}`));

// 단가 확정
export const confirmPrice = async (priceId) =>
  asText(await apiFetch(`/api/contracts/prices/${priceId}/confirm`, { method: "POST" }));

// 당일 단가 수동 재계산 → { calcDate, recalculated }
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

// ─── 거래처 ────────────────────────────────────────────────────────────────
// 거래처(회사) 셀렉트용 목록 → [{ id, name }]
export const fetchCompanies = async (keyword) => {
  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  const qs = params.toString();
  return asJson(await apiFetch(`/api/companies${qs ? `?${qs}` : ""}`));
};
