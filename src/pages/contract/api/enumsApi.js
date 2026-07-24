import { apiFetch } from "../../../utils/api";

// 프론트 셀렉트/라디오용 enum 옵션 그룹 (GET /api/enums/{group})
export const ENUM_GROUPS = {
  PRICE_TYPE: "PRICE_TYPE", // 단가 종류 (가단가/확정가/정산가/원가)
  PRICE_SOURCE: "PRICE_SOURCE", // 단가 산출 방식 (계산/고정)
  CALC_METHOD: "CALC_METHOD", // 계산식 (수출 표준/내수/원가)
  TRADE_TYPE: "TRADE_TYPE", // 거래 형태 (수출/내수)
  PAID_CURRENCY: "PAID_CURRENCY", // 수취 통화 (달러/원화)
  CONTRACT_STATUS: "CONTRACT_STATUS", // 계약 진행 상태 (예정/진행중/완료/취소)
  OWNER_COMPANY: "OWNER_COMPANY", // 자사 구분 (호재/우남)
};

// 단일 그룹 옵션 조회 → [{ value, label }]
export const fetchEnum = async (group) => {
  const res = await apiFetch(`/api/enums/${group}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// 여러 그룹을 한 번에 조회 → { [group]: [{ value, label }] }
export const fetchEnums = async (groups) => {
  const entries = await Promise.all(
    groups.map(async (group) => [group, await fetchEnum(group)])
  );
  return Object.fromEntries(entries);
};
