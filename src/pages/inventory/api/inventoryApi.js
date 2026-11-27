import { apiFetch } from "../../../utils/api";

// 공통 응답 처리 — 실패 시 서버 메시지와 status·code 를 담아 throw
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

const post = async (path, body) =>
  asJson(
    await apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

// 자사·품목 조건 공통 — 자사 '전체'는 파라미터 생략, itemIds 는 콤마 구분
const conditionParams = ({ ownerCompany, itemIds }) => {
  const params = new URLSearchParams();
  if (ownerCompany) params.set("ownerCompany", ownerCompany);
  if (itemIds?.length) params.set("itemIds", itemIds.join(","));
  return params;
};

// 기준일 품목별 재고 (GET /api/inventory/stock)
// excludeManualMovements=true 면 보정 내역(증가·감소·품목 이동)을 빼고 계근데이터만으로 계산한다(서버 기본 false)
// → { asOfDate, ownerCompany, items[{ itemId, itemName, parentItemId, depth, ownQuantityKg, quantityKg }], totalQuantityKg, unmapped }
export const fetchStock = async ({ asOfDate, ownerCompany = "", itemIds = [], excludeManualMovements = false }) => {
  const params = conditionParams({ ownerCompany, itemIds });
  if (asOfDate) params.set("asOfDate", asOfDate);
  if (excludeManualMovements) params.set("excludeManualMovements", "true");
  return asJson(await apiFetch(`/api/inventory/stock?${params}`));
};

// 일자별 거래처·품목 거래량 (GET /api/inventory/stock/daily-trades) → { date, ownerCompany, purchase, sale }
export const fetchDailyTrades = async ({ date, ownerCompany = "", itemIds = [] }) => {
  const params = conditionParams({ ownerCompany, itemIds });
  if (date) params.set("date", date);
  return asJson(await apiFetch(`/api/inventory/stock/daily-trades?${params}`));
};

// 기간별 품목별 입출고 통계 (GET /api/inventory/stock/period-trades)
// → { dateFrom, dateTo, ownerCompany, companyId,
//     items[{ itemId, itemName, parentItemId, depth, purchase, sale, ownPurchase, ownSale }],
//     totalPurchase, totalSale, unmapped }
// 통계 항목은 { quantityKg, weighingCount, averageUnitPrice(원/kg, 없으면 null), unpricedQuantityKg }
export const fetchPeriodTrades = async ({ dateFrom = "", dateTo = "", ownerCompany = "", companyId = "", itemIds = [] }) => {
  const params = conditionParams({ ownerCompany, itemIds });
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (companyId) params.set("companyId", String(companyId));
  return asJson(await apiFetch(`/api/inventory/stock/period-trades?${params}`));
};

// 기간 통계 한 칸(품목 × 매입/매출)에 집계된 계근 목록 (GET /api/inventory/stock/period-trades/weighings) → 공통 페이지 형식
// tradeDirection 필수(PURCHASE/SALE). itemIds 는 각 품목의 하위 품목까지 포함하며, 생략하면 매핑된 전체 품목
// content[{ weighingRecordId, ownerCompany, weighingDate, secondWeighedAt, vehicleNumber, companyId, companyName,
//           itemId, itemName, transactionId, netWeightKg, priceQuantityKg, unitPrice, amount, saleLineApplied }]
export const fetchPeriodTradeWeighings = async ({
  dateFrom = "",
  dateTo = "",
  ownerCompany = "",
  companyId = "",
  tradeDirection,
  itemIds = [],
  page = 1,
  size = 20,
}) => {
  const params = conditionParams({ ownerCompany, itemIds });
  params.set("tradeDirection", tradeDirection);
  params.set("page", String(page));
  params.set("size", String(size));
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (companyId) params.set("companyId", String(companyId));
  return asJson(await apiFetch(`/api/inventory/stock/period-trades/weighings?${params}`));
};

// 보정 내역 (GET /api/inventory/movements) → 공통 페이지 형식
// excludeCanceled=true 면 취소된 내역과 그 취소 내역을 모두 제외한다(서버 기본 false)
export const fetchMovements = async ({
  ownerCompany = "",
  dateFrom = "",
  dateTo = "",
  itemId = "",
  movementType = "",
  excludeCanceled = false,
  page = 1,
  size = 20,
}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (ownerCompany) params.set("ownerCompany", ownerCompany);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (itemId) params.set("itemId", String(itemId));
  if (movementType) params.set("movementType", movementType);
  if (excludeCanceled) params.set("excludeCanceled", "true");
  return asJson(await apiFetch(`/api/inventory/movements?${params}`));
};

// 일일 재고 확인 (POST /api/inventory/movements/stock-counts)
// body { ownerCompany, occurredDate, items[{ itemId, actualQuantityKg }], reason }
// → { message, data: { occurredDate, items[{ itemId, bookQuantityKg, actualQuantityKg, differenceKg, movementId }] } }
export const createStockCount = async (body) => {
  return post("/api/inventory/movements/stock-counts", body);
};

// 품목 간 이동 (POST /api/inventory/movements/transfers)
// body { ownerCompany, occurredDate, fromItemId, toItemId, quantityKg, reason } → { message, data: { movementId } }
export const createTransfer = async (body) => {
  return post("/api/inventory/movements/transfers", body);
};

// 재고 증감 (POST /api/inventory/movements/adjustments)
// body { ownerCompany, occurredDate, itemId, direction, quantityKg, reason } → { message, data: { movementId } }
export const createAdjustment = async (body) => {
  return post("/api/inventory/movements/adjustments", body);
};

// 보정 취소 (POST /api/inventory/movements/{movementId}/cancel) — 사유 생략 가능 → { message, data: { movementId } }
export const cancelMovement = async (movementId, reason) => {
  return post(`/api/inventory/movements/${movementId}/cancel`, { reason: reason || null });
};
