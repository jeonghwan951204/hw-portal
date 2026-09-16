import { apiFetch } from "../../../utils/api";
import { USE_MOCK } from "../../../utils/env";
import * as companyMock from "./companyMock";

// 거래처 화면의 셀렉트/필터용 enum 옵션 그룹 (GET /api/enums/{group})
export const COMPANY_ENUM_GROUPS = {
  COMPANY_TYPE: "COMPANY_TYPE", // 거래처 유형 (매입처/매출처/기타)
};

// 단일 그룹 옵션 조회 → [{ value, label }]
export const fetchEnum = async (group) => {
  const res = await apiFetch(`/api/enums/${group}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// 거래처 유형 선택값 조회
export const fetchCompanyTypeOptions = () =>
  USE_MOCK
    ? companyMock.fetchCompanyTypeOptions()
    : fetchEnum(COMPANY_ENUM_GROUPS.COMPANY_TYPE);
