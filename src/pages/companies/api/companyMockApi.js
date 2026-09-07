import { MOCK_COMPANIES } from "../mockData";

const STORAGE_KEY = "hw-portal-mock-companies-v1";

const clone = (value) => JSON.parse(JSON.stringify(value));

const sanitizeCompany = (company) => ({
  ...company,
  attachments: company.attachments.map(({ id, name }) => ({ id, name })),
});

const readStoredCompanies = () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const writeCompanies = (companies) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  } catch {
    // 목업 저장소를 사용할 수 없는 환경에서는 현재 화면 상태만 유지합니다.
  }
  return clone(companies);
};

export const getMockCompanies = () => readStoredCompanies() ?? clone(MOCK_COMPANIES);

export const getMockCompany = (companyId) =>
  getMockCompanies().find((company) => String(company.id) === String(companyId)) ?? null;

export const createMockCompany = (form) => {
  const companies = getMockCompanies();
  const numericIds = companies.map(({ id }) => Number(id)).filter(Number.isFinite);
  const company = sanitizeCompany({
    ...form,
    id: numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1,
  });
  writeCompanies([company, ...companies]);
  return clone(company);
};

export const updateMockCompany = (companyId, form) => {
  const companies = getMockCompanies();
  const company = sanitizeCompany({ ...form, id: Number(companyId) });
  writeCompanies(
    companies.map((item) => (String(item.id) === String(companyId) ? company : item))
  );
  return clone(company);
};

export const deleteMockCompany = (companyId) =>
  writeCompanies(
    getMockCompanies().filter((company) => String(company.id) !== String(companyId))
  );
