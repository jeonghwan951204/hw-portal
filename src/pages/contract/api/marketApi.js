import { apiFetch } from "../../../utils/api";

const asJson = async (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

/**
 * 계약 목록 배너용 최근 시장 현황.
 * GET /api/price/latest → { lme:{baseDate,price}, exchange:{baseDate,rate}, krwPerKg }
 * (LME·환율 기준일은 서로 다를 수 있음. krwPerKg = 원화환산 원/kg)
 * @returns {Promise<{lme:{value,date}, exchangeRate:{value,date}, krwPerKg}|null>}
 */
export const fetchMarketSummary = async () => {
  const data = await asJson(await apiFetch(`/api/price/latest`));
  if (!data) return null;
  return {
    lme: { value: data.lme?.price ?? null, date: data.lme?.baseDate ?? null },
    exchangeRate: { value: data.exchange?.rate ?? null, date: data.exchange?.baseDate ?? null },
    krwPerKg: data.krwPerKg ?? null,
  };
};
