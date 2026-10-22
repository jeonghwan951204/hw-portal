import { apiFetch } from "../../../utils/api";

// 다른 작업자가 먼저 수정해 version 이 맞지 않을 때의 서버 에러 코드
export const VERSION_CONFLICT_CODE = "WEIGHING_TRANSACTION_CONFLICT";
// 거래처가 서로 다른 계근을 확인 없이 묶으려 할 때 등 상태 충돌
export const STATE_CONFLICT_CODE = "WEIGHING_TRANSACTION_STATE_CONFLICT";

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
  sortOrder = "",
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
  // sortOrder: OLDEST(서버 기본, 거래일 오래된 순) | LATEST(최신순) — 같은 거래일은 ID 순
  if (sortOrder) params.set("sortOrder", sortOrder);
  return asJson(await apiFetch(`${BASE}?${params}`));
};

// 거래 상세 (포함 계근 또는 수기 품목 포함)
export const fetchTransactionDetail = async (transactionId) =>
  asJson(await apiFetch(`${BASE}/${transactionId}`));

// 거래 등록용 미배정 계근 (GET /api/weighing-transactions/unassigned-weighing-records, page 1-기반)
// 이미 거래에 배정됐거나 원본이 삭제된 계근은 서버에서 제외된다. counterpartyName 은 원본 거래처명 부분검색.
export const fetchUnassignedWeighingRecords = async ({
  dateFrom = "",
  dateTo = "",
  ownerCompany = "",
  tradeDirection = "",
  counterpartyName = "",
  vehicleNumber = "",
  page = 1,
  size = 50,
}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (ownerCompany) params.set("ownerCompany", ownerCompany);
  if (tradeDirection) params.set("tradeDirection", tradeDirection);
  if (counterpartyName.trim()) params.set("counterpartyName", counterpartyName.trim());
  if (vehicleNumber.trim()) params.set("vehicleNumber", vehicleNumber.trim());
  return asJson(await apiFetch(`${BASE}/unassigned-weighing-records?${params}`));
};

// ─── 변경 — 모든 응답은 변경 후 WeighingTransactionDetailResponse ─────────
// 선택한 미배정 계근으로 거래 등록 { weighingRecordIds(1~1000), allowCounterpartyMismatch, memo }
// 자사·거래구분·통화가 같아야 하고, 거래처가 다르면 allowCounterpartyMismatch=true 가 필요하다.
export const createTransaction = (body) => send(BASE, "POST", body);

// 수기 거래 생성 { ownerCompany, companyId, counterpartyName, tradeDirection, transactionDate, currency, memo, items[] }
export const createManualTransaction = (body) => send(`${BASE}/manual`, "POST", body);

// 계근 행 적용 단가·실제출고량 수정 { appliedUnitPrice, actualDeliveryWeightKg, version } — 두 값 모두 그대로 저장(null=지움)
export const updateWeighingRecord = (transactionId, mappingId, body) =>
  send(`${BASE}/${transactionId}/weighing-records/${mappingId}`, "PATCH", body);

// 수기 품목 수정 { vehicleNumber, itemId, itemName, netWeightKg, acceptedWeightKg, deductionWeightKg, appliedUnitPrice, actualDeliveryWeightKg, memo, version }
export const updateManualItem = (transactionId, manualItemId, body) =>
  send(`${BASE}/${transactionId}/manual-items/${manualItemId}`, "PATCH", body);

// 계근 거래처·품목 수동 매핑 (PATCH /api/weighing-mappings/{weighingRecordId}) { companyId, itemId }
// 경로 ID 는 계근 원본 weighingRecordId(mappingId 아님). 생략·null 항목은 기존 값 유지, 최소 하나 필요.
// 응답 transactionId/transactionVersion — 진행 중 거래의 계근이면 거래 버전이 오르므로 상세를 다시 받아야 한다.
export const mapWeighingRecord = (weighingRecordId, body) =>
  send(`/api/weighing-mappings/${weighingRecordId}`, "PATCH", body);

// 결제정보 수정 { paymentStatus, paymentAmount, version } — PAID 저장 시 서버에서 마감 처리
export const updateTransactionPayment = (transactionId, body) => send(`${BASE}/${transactionId}/payment`, "PATCH", body);

// 여러 진행 중 거래 합치기 { targetTransactionId, targetVersion, sources[], allowCounterpartyMismatch, reason } → 대상 거래 상세
export const mergeTransactions = (body) => send(`${BASE}/merge`, "POST", body);
