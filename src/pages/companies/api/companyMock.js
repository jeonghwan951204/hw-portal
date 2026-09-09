// 로컬 목업 모드(VITE_USE_MOCK)에서 거래처 API 대신 사용하는 데이터와 처리.
// 변경 사항은 메모리에만 유지되므로 새로고침하면 초기 데이터로 돌아간다.

const MOCK_COMPANY_TYPE_OPTIONS = [
  { value: "PURCHASE", label: "매입처" },
  { value: "SALES", label: "매출처" },
  { value: "OTHER", label: "기타" },
];

const createSeedCompanies = () => [
  {
    id: 1,
    type: "PURCHASE",
    name: "대한금속산업",
    representative: "김대한",
    businessNumber: "123-45-67890",
    aliases: ["대한금속", "DH METAL"],
    bankAccounts: [
      { recordId: 11, label: "거래용", bankName: "국민은행", accountNumber: "123456-04-567890" },
      { recordId: 12, label: "세금용", bankName: "기업은행", accountNumber: "987-654321-01-011" },
    ],
    phoneNumbers: [
      { recordId: 21, label: "대표전화", value: "02-1234-5678", listVisible: true },
      { recordId: 22, label: "팩스", value: "02-1234-5679", listVisible: false },
      { recordId: 23, label: "물류담당", value: "010-2345-6789", listVisible: true },
    ],
    emails: [
      { recordId: 31, label: "세금계산서", value: "tax.invoice.daehan@daehan-metal.co.kr", listVisible: true },
      { recordId: 32, label: "업무", value: "sales@daehan-metal.co.kr", listVisible: false },
    ],
    addresses: [
      { recordId: 41, label: "사업장", value: "경기도 안산시 단원구 산단로 123 대한금속산업 본관 3층" },
    ],
    memo: "매월 말일 세금계산서 발행. 하차 전 담당자 확인 필요.",
    attachments: [],
  },
  {
    id: 2,
    type: "SALES",
    name: "한빛트레이딩",
    representative: "이한빛",
    businessNumber: "220-81-33445",
    aliases: ["한빛"],
    bankAccounts: [
      { recordId: 13, label: "거래용", bankName: "신한은행", accountNumber: "110-333-556677" },
    ],
    phoneNumbers: [
      { recordId: 24, label: "대표전화", value: "031-777-8899", listVisible: true },
    ],
    emails: [
      { recordId: 33, label: "세금계산서", value: "account@hanbit-trading.com", listVisible: true },
    ],
    addresses: [
      { recordId: 42, label: "사업장", value: "인천광역시 서구 가좌로 45" },
      { recordId: 43, label: "하차지", value: "충청남도 당진시 송산면 무수동로 200" },
    ],
    memo: "",
    attachments: [],
  },
  {
    id: 3,
    type: "OTHER",
    name: "성진리사이클링",
    representative: "박성진",
    businessNumber: "",
    aliases: [],
    bankAccounts: [],
    phoneNumbers: [
      { recordId: 25, label: "대표전화", value: "051-456-7890", listVisible: true },
    ],
    emails: [],
    addresses: [{ recordId: 44, label: "사업장", value: "부산광역시 사상구 학감대로 88" }],
    memo: "임가공 협력사.",
    attachments: [],
  },
];

let companies = createSeedCompanies();
let nextId = 4;
let nextRecordId = 100;

const clone = (value) => JSON.parse(JSON.stringify(value));
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const notFound = (companyId) => {
  const error = new Error(`거래처(${companyId})를 찾을 수 없습니다.`);
  error.status = 404;
  return error;
};

const findIndex = (companyId) =>
  companies.findIndex((company) => String(company.id) === String(companyId));

const nonEmpty = (value) => String(value ?? "").trim();
const withRecordId = (recordId) => recordId ?? ++nextRecordId;

// 폼 모델 → 저장 모델. 실제 API 의 요청/응답 변환과 같은 결과가 되도록 맞춘다.
const toStoredCompany = (form, id) => ({
  id,
  type: form.type,
  name: form.name.trim(),
  representative: nonEmpty(form.representative),
  businessNumber: nonEmpty(form.businessNumber),
  aliases: form.aliases.map((alias) => nonEmpty(alias.value)).filter(Boolean),
  bankAccounts: form.bankAccounts
    .filter((account) => nonEmpty(account.bankName) || nonEmpty(account.accountNumber))
    .map((account) => ({
      recordId: withRecordId(account.recordId),
      label: nonEmpty(account.label),
      bankName: nonEmpty(account.bankName),
      accountNumber: nonEmpty(account.accountNumber),
    })),
  phoneNumbers: form.phoneNumbers
    .filter((phone) => nonEmpty(phone.value))
    .map((phone) => ({
      recordId: withRecordId(phone.recordId),
      label: nonEmpty(phone.label),
      value: nonEmpty(phone.value),
      listVisible: Boolean(phone.listVisible),
    })),
  emails: form.emails
    .filter((email) => nonEmpty(email.value))
    .map((email) => ({
      recordId: withRecordId(email.recordId),
      label: nonEmpty(email.label),
      value: nonEmpty(email.value),
      listVisible: Boolean(email.listVisible),
    })),
  addresses: form.addresses
    .filter((address) => nonEmpty(address.value))
    .map((address) => ({
      recordId: withRecordId(address.recordId),
      label: nonEmpty(address.label),
      value: nonEmpty(address.value),
    })),
  memo: nonEmpty(form.memo),
  // 목업 모드에서는 실제 업로드 없이 선택한 파일명만 유지한다.
  attachments: form.attachments.map((file) => ({
    id: file.fileId ?? file.id,
    fileId: file.fileId ?? file.id,
    name: file.name,
    downloadUrl: file.downloadUrl ?? null,
  })),
});

export const fetchCompanyTypeOptions = async () => {
  await delay();
  return clone(MOCK_COMPANY_TYPE_OPTIONS);
};

export const fetchCompanies = async () => {
  await delay();
  return clone(companies);
};

export const fetchCompanyDetail = async (companyId) => {
  await delay();
  const index = findIndex(companyId);
  if (index === -1) throw notFound(companyId);
  return clone(companies[index]);
};

export const fetchCompanyForEdit = (companyId) => fetchCompanyDetail(companyId);

export const createCompany = async (form) => {
  await delay();
  companies = [...companies, toStoredCompany(form, nextId++)];
  return { message: "거래처를 등록했습니다." };
};

export const updateCompany = async (companyId, form) => {
  await delay();
  const index = findIndex(companyId);
  if (index === -1) throw notFound(companyId);
  const next = [...companies];
  next[index] = toStoredCompany(form, companies[index].id);
  companies = next;
  return { message: "거래처를 수정했습니다." };
};

export const deleteCompany = async (companyId) => {
  await delay();
  const index = findIndex(companyId);
  if (index === -1) throw notFound(companyId);
  companies = companies.filter((_, position) => position !== index);
  return { message: "거래처를 삭제했습니다." };
};
