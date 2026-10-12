import { apiFetch } from "../../../utils/api";
import { USE_MOCK } from "../../../utils/env";

// 로컬 목업 모드에서 사용하는 화면 검토용 데이터입니다.
const WEIGHINGS = [
  {
    id: 1,
    type: "매입",
    ownerCompany: "HOJAE",
    weighedAt: "2026-10-12",
    weighedTime: "09:42",
    companyName: "한국전선(주)",
    vehicleNumber: "86가 1234",
    itemName: "A동",
    grossWeight: 12980,
    tareWeight: 4280,
    receivedWeight: 8700,
    unitPrice: 12850,
    amount: 111795000,
    driverName: "김현수",
    memo: "입고 계근 완료",
  },
  {
    id: 2,
    type: "매입",
    ownerCompany: "HOJAE",
    weighedAt: "2026-10-12",
    weighedTime: "08:17",
    companyName: "대성금속",
    vehicleNumber: "92나 5678",
    itemName: "상동",
    grossWeight: 10620,
    tareWeight: 3910,
    receivedWeight: 6710,
    unitPrice: 13100,
    amount: 87901000,
    driverName: "박준호",
    memo: "",
  },
  {
    id: 3,
    type: "매입",
    ownerCompany: "WOONAM",
    weighedAt: "2026-10-11",
    weighedTime: "15:31",
    companyName: "우진자원",
    vehicleNumber: "81다 9087",
    itemName: "파동",
    grossWeight: 15180,
    tareWeight: 4520,
    receivedWeight: 10660,
    unitPrice: 11950,
    amount: 127387000,
    driverName: "이성민",
    memo: "수분 감량 반영",
  },
  {
    id: 4,
    type: "매출",
    ownerCompany: "HOJAE",
    weighedAt: "2026-10-11",
    weighedTime: "11:05",
    companyName: "삼성전기(주)",
    vehicleNumber: "83라 3412",
    itemName: "밀베리",
    grossWeight: 9160,
    tareWeight: 3620,
    receivedWeight: 5540,
    unitPrice: 13500,
    amount: 74790000,
    driverName: "최영진",
    memo: "",
  },
  {
    id: 5,
    type: "매입",
    ownerCompany: "WOONAM",
    weighedAt: "2026-10-10",
    weighedTime: "16:22",
    companyName: "동아비철",
    vehicleNumber: "95마 7754",
    itemName: "B동",
    grossWeight: 13740,
    tareWeight: 4360,
    receivedWeight: 9380,
    unitPrice: 12400,
    amount: 116312000,
    driverName: "정우석",
    memo: "2차 입고",
  },
  {
    id: 6,
    type: "매입",
    ownerCompany: "HOJAE",
    weighedAt: "2026-10-09",
    weighedTime: "10:48",
    companyName: "한국전선(주)",
    vehicleNumber: "86가 1234",
    itemName: "A동",
    grossWeight: 12450,
    tareWeight: 4280,
    receivedWeight: 8170,
    unitPrice: 12750,
    amount: 104167500,
    driverName: "김현수",
    memo: "",
  },
  {
    id: 7,
    type: "매출",
    ownerCompany: "WOONAM",
    weighedAt: "2026-10-08",
    weighedTime: "13:09",
    companyName: "미래산업",
    vehicleNumber: "89바 2201",
    itemName: "상동",
    grossWeight: 11200,
    tareWeight: 4050,
    receivedWeight: 7150,
    unitPrice: 13000,
    amount: 92950000,
    driverName: "한재민",
    memo: "검수 완료",
  },
];

const asJson = async (response) => {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.clone().json();
      if (body?.message) message = body.message;
    } catch {
      const text = await response.text().catch(() => "");
      if (text) message = text;
    }
    throw new Error(message);
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
});

const fetchMockWeighings = ({
  dateFrom,
  dateTo,
  counterpartyName,
  vehicleNumber,
  tradeDirection,
  ownerCompany,
  page,
  size,
}) => {
  const normalizedCompany = counterpartyName.trim().toLocaleLowerCase("ko-KR");
  const normalizedVehicle = vehicleNumber.replaceAll(" ", "").toLocaleLowerCase("ko-KR");
  const filtered = WEIGHINGS.filter((weighing) =>
    (!dateFrom || weighing.weighedAt >= dateFrom) &&
    (!dateTo || weighing.weighedAt <= dateTo) &&
    (!tradeDirection || weighing.type === tradeTypeLabelOf(tradeDirection)) &&
    (!ownerCompany || weighing.ownerCompany === ownerCompany) &&
    (!normalizedCompany || weighing.companyName.toLocaleLowerCase("ko-KR").includes(normalizedCompany)) &&
    (!normalizedVehicle || weighing.vehicleNumber.replaceAll(" ", "").toLocaleLowerCase("ko-KR").includes(normalizedVehicle))
  );
  const offset = (page - 1) * size;
  return {
    content: filtered.slice(offset, offset + size).map((item) => ({ ...item })),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / size)),
  };
};

export const fetchWeighings = async ({
  dateFrom = "",
  dateTo = "",
  counterpartyName = "",
  vehicleNumber = "",
  tradeDirection = "",
  ownerCompany = "HOJAE",
  page = 1,
  size = 20,
}) => {
  if (USE_MOCK) {
    return fetchMockWeighings({
      dateFrom,
      dateTo,
      counterpartyName,
      vehicleNumber,
      tradeDirection,
      ownerCompany,
      page,
      size,
    });
  }

  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (counterpartyName.trim()) params.set("counterpartyName", counterpartyName.trim());
  if (vehicleNumber.trim()) params.set("vehicleNumber", vehicleNumber.trim());
  if (tradeDirection) params.set("tradeDirection", tradeDirection);
  if (ownerCompany) params.set("ownerCompany", ownerCompany);

  const response = await asJson(await apiFetch(`/api/admin/weighing-records?${params}`));
  return {
    ...response,
    content: (response.content ?? []).map(mapWeighingRecord),
  };
};
