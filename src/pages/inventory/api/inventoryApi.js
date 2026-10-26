import { apiFetch } from "../../../utils/api";
import { USE_MOCK } from "../../../utils/env";
import * as inventoryMock from "./inventoryMock";

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
// → { asOfDate, ownerCompany, items[{ itemId, itemName, parentItemId, depth, ownQuantityKg, quantityKg }], totalQuantityKg, unmapped }
export const fetchStock = async ({ asOfDate, ownerCompany = "", itemIds = [] }) => {
  if (USE_MOCK) return inventoryMock.fetchStock({ asOfDate, ownerCompany, itemIds });
  const params = conditionParams({ ownerCompany, itemIds });
  if (asOfDate) params.set("asOfDate", asOfDate);
  return asJson(await apiFetch(`/api/inventory/stock?${params}`));
};

// 일자별 거래처·품목 거래량 (GET /api/inventory/stock/daily-trades) → { date, ownerCompany, purchase, sale }
export const fetchDailyTrades = async ({ date, ownerCompany = "", itemIds = [] }) => {
  if (USE_MOCK) return inventoryMock.fetchDailyTrades({ date, ownerCompany, itemIds });
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
  if (USE_MOCK) return inventoryMock.fetchPeriodTrades({ dateFrom, dateTo, ownerCompany, companyId, itemIds });
  const params = conditionParams({ ownerCompany, itemIds });
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (companyId) params.set("companyId", String(companyId));
  return asJson(await apiFetch(`/api/inventory/stock/period-trades?${params}`));
};

// 보정 내역 (GET /api/inventory/movements) → 공통 페이지 형식
export const fetchMovements = async ({
  ownerCompany = "",
  dateFrom = "",
  dateTo = "",
  itemId = "",
  movementType = "",
  page = 1,
  size = 20,
}) => {
  if (USE_MOCK) {
    return inventoryMock.fetchMovements({ ownerCompany, dateFrom, dateTo, itemId, movementType, page, size });
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (ownerCompany) params.set("ownerCompany", ownerCompany);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (itemId) params.set("itemId", String(itemId));
  if (movementType) params.set("movementType", movementType);
  return asJson(await apiFetch(`/api/inventory/movements?${params}`));
};

// 일일 재고 확인 (POST /api/inventory/movements/stock-counts)
// body { ownerCompany, occurredDate, items[{ itemId, actualQuantityKg }], reason }
// → { message, data: { occurredDate, items[{ itemId, bookQuantityKg, actualQuantityKg, differenceKg, movementId }] } }
export const createStockCount = async (body) => {
  if (USE_MOCK) return inventoryMock.createStockCount(body);
  return post("/api/inventory/movements/stock-counts", body);
};

// 품목 간 이동 (POST /api/inventory/movements/transfers)
// body { ownerCompany, occurredDate, fromItemId, toItemId, quantityKg, reason } → { message, data: { movementId } }
export const createTransfer = async (body) => {
  if (USE_MOCK) return inventoryMock.createTransfer(body);
  return post("/api/inventory/movements/transfers", body);
};

// 재고 증감 (POST /api/inventory/movements/adjustments)
// body { ownerCompany, occurredDate, itemId, direction, quantityKg, reason } → { message, data: { movementId } }
export const createAdjustment = async (body) => {
  if (USE_MOCK) return inventoryMock.createAdjustment(body);
  return post("/api/inventory/movements/adjustments", body);
};

// 보정 취소 (POST /api/inventory/movements/{movementId}/cancel) — 사유 생략 가능 → { message, data: { movementId } }
export const cancelMovement = async (movementId, reason) => {
  if (USE_MOCK) return inventoryMock.cancelMovement(movementId, reason);
  return post(`/api/inventory/movements/${movementId}/cancel`, { reason: reason || null });
};
