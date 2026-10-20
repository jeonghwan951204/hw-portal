import { apiFetch } from "../../../utils/api";

// 다른 작업자가 먼저 수정해 version 이 맞지 않을 때의 서버 에러 코드
export const VERSION_CONFLICT_CODE = "WEIGHING_TRANSACTION_CONFLICT";

// 공통 응답 처리 — 실패 시 서버 메시지와 status·code 를 담아 throw (409 버전 충돌 판별용)
const asJson = async (res) => {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let code = null;
    try {
      const body = await res.clone().json();
      if (body?.message) message = body.message;
      code = body?.code ?? null;
    } catch {
      const text = await res.text().catch(() => "");
      if (text) message = text;
    }
    const error = new Error(message);
    error.status = res.status;
    error.code = code;
    throw error;
  }
  return res.json();
};

const BASE = "/api/weighing-transactions";

const send = async (path, method, body) =>
  asJson(
    await apiFetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

// ─── 조회 ─────────────────────────────────────────────────────────────────
// 거래 목록 (GET /api/weighing-transactions, page 1-기반) — 값이 없는 필터는 파라미터에서 제외
export const fetchTransactions = async ({
  dateFrom = "",
  dateTo = "",
  companyId = "",
  ownerCompany = "",
  tradeDirection = "",
  paymentStatus = "",
  hasWarning = "",
  page = 1,
  size = 20,
}) => {
  // MERGED 거래는 서버에서 항상 제외된다. hasWarning: 생략=전체, "true"=경고 있음, "false"=경고 없음
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (companyId) params.set("companyId", String(companyId));
  if (ownerCompany) params.set("ownerCompany", ownerCompany);
  if (tradeDirection) params.set("tradeDirection", tradeDirection);
  if (paymentStatus) params.set("paymentStatus", paymentStatus);
  if (hasWarning) params.set("hasWarning", hasWarning);
  return asJson(await apiFetch(`${BASE}?${params}`));
};

// 거래 상세 (포함 계근 또는 수기 품목 포함)
export const fetchTransactionDetail = async (transactionId) =>
  asJson(await apiFetch(`${BASE}/${transactionId}`));

// 거래 변경 이력 (최신순)
export const fetchTransactionHistory = async (transactionId) =>
  asJson(await apiFetch(`${BASE}/${transactionId}/history`));

// ─── 변경 — 모든 응답은 변경 후 WeighingTransactionDetailResponse ─────────
// 수기 거래 생성 { ownerCompany, companyId, counterpartyName, tradeDirection, transactionDate, currency, memo, items[] }
export const createManualTransaction = (body) => send(`${BASE}/manual`, "POST", body);

// 확인 전 거래 헤더 수정 { companyId, counterpartyName, tradeDirection, transactionDate, memo, version }
export const updateTransactionHeader = (transactionId, body) => send(`${BASE}/${transactionId}`, "PATCH", body);

// 계근 행 적용 단가·실제출고량 수정 { appliedUnitPrice, actualDeliveryWeightKg, version }
export const updateWeighingRecord = (transactionId, mappingId, body) =>
  send(`${BASE}/${transactionId}/weighing-records/${mappingId}`, "PATCH", body);

// 수기 품목 추가 { item, version }
export const addManualItem = (transactionId, body) => send(`${BASE}/${transactionId}/manual-items`, "POST", body);

// 수기 품목 수정 { ...item, version }
export const updateManualItem = (transactionId, manualItemId, body) =>
  send(`${BASE}/${transactionId}/manual-items/${manualItemId}`, "PATCH", body);

// 수기 품목 삭제 { version } — DELETE 지만 본문으로 version 을 보낸다
export const deleteManualItem = (transactionId, manualItemId, body) =>
  send(`${BASE}/${transactionId}/manual-items/${manualItemId}`, "DELETE", body);

// 거래 확인 { version, reason }
export const confirmTransaction = (transactionId, body) => send(`${BASE}/${transactionId}/confirmation`, "POST", body);

// 확인 취소 { version, reason } — 결제 완료 전만 가능
export const cancelTransactionConfirmation = (transactionId, body) =>
  send(`${BASE}/${transactionId}/confirmation/cancel`, "POST", body);

// 결제정보 수정 { paymentStatus, paymentAmount, version } — PAID 저장 시 서버에서 마감 처리
export const updateTransactionPayment = (transactionId, body) => send(`${BASE}/${transactionId}/payment`, "PATCH", body);

// 선택 계근을 다른 거래로 이동 { targetTransactionId, weighingRecordIds, sourceVersion, targetVersion, allowCounterpartyMismatch, reason }
export const moveWeighingRecords = (transactionId, body) => send(`${BASE}/${transactionId}/move-records`, "POST", body);

// 선택 계근으로 새 거래 분리 { weighingRecordIds, sourceVersion, reason } → 새 거래 상세
export const splitTransaction = (transactionId, body) => send(`${BASE}/${transactionId}/split`, "POST", body);

// 여러 확인 대기 거래 합치기 { targetTransactionId, targetVersion, sources[], allowCounterpartyMismatch, reason } → 대상 거래 상세
export const mergeTransactions = (body) => send(`${BASE}/merge`, "POST", body);
