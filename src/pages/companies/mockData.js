export const MOCK_COMPANIES = [
  {
    id: 1,
    name: "대한비철 주식회사",
    type: "SALES",
    businessNumber: "000-81-00001",
    phoneNumbers: [
      { label: "대표전화", value: "02-0000-0001" },
      { label: "영업담당", value: "010-0000-1001" },
      { label: "팩스", value: "02-0000-0091" },
    ],
    bankAccounts: [
      { label: "거래용", bankName: "기업은행", accountNumber: "000-000000-00-001" },
      { label: "세금용", bankName: "국민은행", accountNumber: "000000-00-000011" },
    ],
    representative: "김대한",
    emails: [
      { label: "세금계산서", value: "sample1@example.com" },
      { label: "업무용", value: "sales1@example.com" },
    ],
    addresses: [
      { label: "사업장", value: "서울특별시 영등포구 산업로 10" },
      { label: "우편물", value: "서울특별시 영등포구 업무로 11" },
    ],
    memo: "월말 정산 거래처",
    attachments: [
      { id: 11, name: "대한비철_사업자등록증.pdf" },
      { id: 12, name: "대한비철_통장사본.pdf" },
    ],
  },
  {
    id: 2,
    name: "한빛금속",
    type: "PURCHASE",
    businessNumber: "000-02-00002",
    phoneNumbers: [
      { label: "대표전화", value: "031-000-0002" },
      { label: "팩스", value: "031-000-0092" },
    ],
    bankAccounts: [
      { label: "거래용", bankName: "국민은행", accountNumber: "000000-00-000002" },
      { label: "세금용", bankName: "기업은행", accountNumber: "000-000000-00-022" },
    ],
    representative: "박한빛",
    emails: [{ label: "세금계산서", value: "sample2@example.com" }],
    addresses: [{ label: "사업장", value: "경기도 시흥시 공단로 20" }],
    memo: "출고 전 계근표 확인",
    attachments: [
      { id: 21, name: "한빛금속_사업자등록증.jpg" },
    ],
  },
  {
    id: 3,
    name: "동아자원",
    type: "PURCHASE",
    businessNumber: "000-15-00003",
    phoneNumbers: [
      { label: "대표전화", value: "032-000-0003" },
      { label: "매입담당", value: "010-0000-1003" },
      { label: "출고담당", value: "010-0000-2003" },
      { label: "팩스", value: "032-000-0093" },
    ],
    bankAccounts: [
      { label: "거래용", bankName: "신한은행", accountNumber: "000-000-000003" },
      { label: "세금용", bankName: "하나은행", accountNumber: "000-000000-00033" },
    ],
    representative: "최동아",
    emails: [{ label: "업무용", value: "sample3@example.com" }],
    addresses: [
      { label: "사업장", value: "인천광역시 서구 자원로 30" },
      { label: "하차지", value: "인천광역시 서구 물류로 31" },
    ],
    memo: "담당자 연락처 우선 사용",
    attachments: [
      { id: 31, name: "동아자원_사업자등록증.pdf" },
      { id: 32, name: "동아자원_거래처안내자료.pdf" },
    ],
  },
  {
    id: 4,
    name: "새롬전선 주식회사",
    type: "SALES",
    businessNumber: "000-81-00004",
    phoneNumbers: [
      { label: "대표전화", value: "041-000-0004" },
      { label: "구매담당", value: "010-0000-1004" },
      { label: "팩스", value: "041-000-0094" },
    ],
    bankAccounts: [
      { label: "거래용", bankName: "하나은행", accountNumber: "000-000000-00004" },
      { label: "세금용", bankName: "우리은행", accountNumber: "0000-000-000044" },
    ],
    representative: "윤새롬",
    emails: [{ label: "세금계산서", value: "sample4@example.com" }],
    addresses: [{ label: "사업장", value: "충청남도 천안시 산업단지로 40" }],
    memo: "전자세금계산서 이메일 발송",
    attachments: [
      { id: 41, name: "새롬전선_사업자등록증.pdf" },
    ],
  },
  {
    id: 5,
    name: "우성메탈",
    type: "PURCHASE",
    businessNumber: "000-20-00005",
    phoneNumbers: [
      { label: "대표전화", value: "051-000-0005" },
    ],
    bankAccounts: [
      { label: "거래용", bankName: "우리은행", accountNumber: "0000-000-000005" },
      { label: "세금용", bankName: "신한은행", accountNumber: "000-000-000055" },
    ],
    representative: "장우성",
    emails: [{ label: "업무용", value: "sample5@example.com" }],
    addresses: [{ label: "사업장", value: "부산광역시 강서구 물류로 50" }],
    memo: "입고 일정 사전 협의",
    attachments: [],
  },
];
