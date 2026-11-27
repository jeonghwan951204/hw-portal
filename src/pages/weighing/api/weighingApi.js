import { apiFetch } from "../../../utils/api";

const asJson = async (response) => {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    let code = null;
    try {
      const body = await response.clone().json();
      if (body?.message) message = body.message;
      code = body?.code ?? null;
    } catch {
      const text = await response.text().catch(() => "");
      if (text) message = text;
    }
    const error = new Error(message);
    error.code = code;
    throw error;
  }
  return response.json();
};

const TRADE_TYPE_LABELS = {
  PURCHASE: "매입",
  SALE: "매출",
};

const tradeTypeLabelOf = (value) => TRADE_TYPE_LABELS[value] ?? value ?? "-";
const timeOf = (value) => (value ? value.slice(11, 16) : "");

const mapWeighingRecord = (record) => ({
  id: record.weighingRecordId,
  type: tradeTypeLabelOf(record.tradeDirection ?? record.sourceTradeType),
  weighedAt: record.weighingDate,
  weighedTime: timeOf(record.secondWeighedAt ?? record.firstWeighedAt),
  companyName: record.sourceCounterpartyName ?? "",
  vehicleNumber: record.vehicleNumber ?? "",
  itemName: record.sourceItemName ?? "",
  firstWeight: record.firstWeightKg,
  secondWeight: record.secondWeightKg,
  netWeight: record.netWeightKg,
  receivedWeight: record.acceptedWeightKg ?? record.netWeightKg,
  unitPrice: record.unitPrice,
  amount: record.amount,
  currency: record.currency,
  priceUnit: record.priceUnit,
  carrierName: record.carrierName ?? "",
  weigherName: record.weigherName ?? "",
  memo: record.memo ?? "",
  sourceCompanyName: record.sourceCompanyName ?? "",
  ownerCompany: record.ownerCompany ?? "",
  sourceCode: record.sourceCode ?? "",
  externalId: record.externalId,
  dailySequence: record.dailySequence,
  firstWeighedAt: record.firstWeighedAt,
  secondWeighedAt: record.secondWeighedAt,
  deductionRate: record.deductionRatePercent,
  deductionWeight: record.deductionWeightKg,
  tickets: (record.tickets ?? []).filter((ticket) => ticket.downloadUrl),
});

export const fetchWeighings = async ({
  dateFrom = "",
  dateTo = "",
  counterpartyName = "",
  vehicleNumber = "",
  tradeDirection = "",
  ownerCompany = "",
  page = 1,
  size = 20,
}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (counterpartyName.trim()) params.set("counterpartyName", counterpartyName.trim());
  if (vehicleNumber.trim()) params.set("vehicleNumber", vehicleNumber.trim());
  if (tradeDirection) params.set("tradeDirection", tradeDirection);
  if (ownerCompany) params.set("ownerCompany", ownerCompany);

  const response = await asJson(await apiFetch(`/api/weighing-records?${params}`));
  return {
    ...response,
    content: (response.content ?? []).map(mapWeighingRecord),
  };
};

// 계근표 PDF는 서버가 요청할 때마다 새로 만든다. 성공하면 PDF Blob, 실패하면 ErrorResponse 메시지로 오류를 던진다.
export const fetchWeighingSlip = async (weighingRecordId) => {
  const response = await apiFetch(`/api/weighing-records/${weighingRecordId}/slip`);
  if (!response.ok) await asJson(response);
  return response.blob();
};

const SYNC_REQUESTS_PATH = "/api/weighing-sync/sync-requests";

export const fetchWeighingSyncRequests = async (page, signal) => {
  const params = new URLSearchParams({ page: String(page), size: "10" });
  return asJson(await apiFetch(`${SYNC_REQUESTS_PATH}?${params}`, { signal }));
};

export const createWeighingSyncRequest = async (request) =>
  asJson(await apiFetch(SYNC_REQUESTS_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }));

export const cancelWeighingSyncRequest = async (requestId) =>
  asJson(await apiFetch(`${SYNC_REQUESTS_PATH}/${requestId}/cancel`, { method: "POST" }));

export const retryWeighingSyncRequest = async (requestId) =>
  asJson(await apiFetch(`${SYNC_REQUESTS_PATH}/${requestId}/retry`, { method: "POST" }));
