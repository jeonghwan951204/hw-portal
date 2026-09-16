// 거래처현황 엑셀 → POST /api/companies 요청 본문 JSON 변환.
// 사용법: node scripts/companies-import/convert.js "<엑셀경로>" [출력폴더]
import fs from "node:fs";
import path from "node:path";
import { readWorkbook } from "./xlsx.js";

// ─── 규칙 설정 ───────────────────────────────────────────────────────────────
// 시트명 → 거래처 유형
const SHEET_TYPES = {
  일반거래처: "OTHER",
  매입처: "PURCHASE",
  매출처: "SALES",
};

// 헤더 텍스트(공백 제거) → 내부 필드명
const HEADER_FIELDS = {
  "No.": "no",
  상호명: "companyName",
  사업자등록번호: "businessNumber",
  대표자: "representative",
  담당자: "manager",
  전화번호: "phone",
  "FAX번호": "fax",
  담당자폰: "mobile",
  주소: "address",
  은행명: "bankName",
  계좌: "account",
  "E-mail주소": "email",
};

// 기본 라벨 (셀 앞에 괄호 라벨이 없을 때)
const DEFAULT_LABELS = {
  phone: "전화번호",
  fax: "fax",
  mobile: "담당자",
  address: "사업장",
  account: "거래용",
  email: "연락용",
};

// 목록 노출(isListVisible) — 연락처·이메일을 모두 목록에 표시한다.
const LIST_VISIBLE = { phone: true, fax: true, mobile: true, email: true };

// ─── 값 가공 ────────────────────────────────────────────────────────────────
const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

// 괄호 안이 번호면 라벨이 아니라 값이다. 예: "(032-226-6545)"
const isNumericLabel = (text) => /\d{2,}/.test(text);

// 한 셀 안의 줄바꿈을 항목으로 나눈다.
// - "~5" 처럼 범위를 잇는 줄은 앞줄에 붙인다.
// - "(대표님)" 처럼 괄호 라벨만 있는 줄은 다음 줄 값과 합친다.
const splitCell = (value) => {
  const lines = String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const merged = [];
  for (const line of lines) {
    const labelOnly = line.match(/^\(([^)]{1,20})\)$/);
    const previous = merged[merged.length - 1];

    if (/^[~-]/.test(line) && previous) merged[merged.length - 1] += line;
    else if (labelOnly && !isNumericLabel(labelOnly[1])) merged.push({ pendingLabel: line });
    else if (previous?.pendingLabel) merged[merged.length - 1] = `${previous.pendingLabel} ${line}`;
    else merged.push(line);
  }
  // 값 없이 라벨만 남은 줄은 값으로 되돌린다.
  return merged.map((line) => (typeof line === "string" ? line : line.pendingLabel));
};

// "(하치장) 경기도 …" → { label: "하치장", value: "경기도 …" }
// "(032-226-6545)" 처럼 괄호가 값 전체를 감싼 경우는 값으로 취급한다.
const splitLabel = (line) => {
  const matched = line.match(/^\(([^)]{1,20})\)\s*(.*)$/);
  if (!matched) return { label: null, value: clean(line) };
  const rest = clean(matched[2]);
  if (!rest || isNumericLabel(matched[1])) return { label: null, value: clean(line.replace(/[()]/g, "")) };
  return { label: clean(matched[1]), value: rest };
};

// 같은 값이 여러 행에 반복되면 한 번만 남긴다(라벨이 붙은 쪽을 우선).
const dedupe = (items, keyOf) => {
  const byKey = new Map();
  for (const item of items) {
    const key = keyOf(item);
    const existing = byKey.get(key);
    if (!existing) byKey.set(key, item);
    else if (existing.label == null && item.label != null) byKey.set(key, item);
  }
  return [...byKey.values()];
};

// 기본 라벨을 쓴 항목이 2개 이상이면 라벨1, 라벨2 … 로 번호를 붙인다.
const numberDefaultLabels = (items, defaultLabel) => {
  const total = items.filter((item) => item.label == null).length;
  let index = 0;
  return items.map((item) => {
    if (item.label != null) return item;
    index += 1;
    return { ...item, label: total > 1 ? `${defaultLabel}${index}` : defaultLabel };
  });
};

// ─── 시트 파싱 ───────────────────────────────────────────────────────────────
const findHeader = (rows) => {
  for (const { row, cells } of rows) {
    const entries = Object.entries(cells);
    const hit = entries.find(([, value]) => clean(value).replace(/\s/g, "") === "상호명");
    if (!hit) continue;

    const columns = {};
    for (const [column, value] of entries) {
      const field = HEADER_FIELDS[clean(value).replace(/\s/g, "")];
      // 상호명이 여러 열에 있는 엑셀이라 첫 번째 열만 사용한다.
      if (field && !columns[field]) columns[field] = column;
    }
    return { headerRow: row, columns };
  }
  throw new Error("상호명 헤더를 찾지 못했습니다.");
};

// 회사 단위로 행을 묶는다.
// No.와 상호명이 있으면 새 회사, 둘 다 없으면 앞 회사의 연속 행,
// No. 없이 상호명만 있는 행부터는 표 아래 메모 영역으로 보고 중단한다.
const groupRows = (rows, columns, headerRow, warnings, sheetName) => {
  const groups = [];
  const byName = new Map();
  let current = null;

  for (const { row, cells } of rows) {
    if (row <= headerRow) continue;

    const no = clean(cells[columns.no]);
    const name = clean(cells[columns.companyName]);

    if (!no && name) {
      warnings.push(`[${sheetName}] ${row}행부터 표 아래 메모로 보고 제외: "${name}"`);
      break;
    }
    if (name) {
      // 같은 회사명이 떨어진 행에 또 나오면 한 거래처로 합친다.
      const existing = byName.get(name);
      if (existing) {
        warnings.push(`[${sheetName}] ${row}행: 같은 회사명이 다시 나와 하나로 합침 "${name}"`);
        existing.rows.push({ row, cells });
        current = existing;
        continue;
      }
      current = { name, rows: [{ row, cells }] };
      byName.set(name, current);
      groups.push(current);
      continue;
    }
    if (!Object.keys(cells).some((column) => column !== columns.no)) continue;
    if (!current) {
      warnings.push(`[${sheetName}] ${row}행: 앞에 회사가 없어 제외`);
      continue;
    }
    current.rows.push({ row, cells });
  }
  return groups;
};

// 한 필드(열)의 모든 행·줄을 라벨 있는 항목 배열로 만든다.
const collect = (group, column, defaultLabel) => {
  const columns = [column].flat().filter(Boolean);
  if (columns.length === 0) return [];
  const items = group.rows.flatMap(({ cells }) =>
    columns.flatMap((each) => splitCell(cells[each]).map(splitLabel).filter((item) => item.value))
  );
  return numberDefaultLabels(dedupe(items, (item) => item.value), defaultLabel);
};

// 일반거래처는 "국민 999-1577-1772" 처럼 은행명과 계좌번호가 한 셀에 있다.
const splitBankAndAccount = (value) => {
  const matched = clean(value).match(/^(\S+)\s+(.*)$/);
  return matched ? { bankName: matched[1], accountNumber: matched[2] } : { bankName: "", accountNumber: clean(value) };
};

const buildAccounts = (group, columns) => {
  // 은행명 열이 따로 있는 시트(매입처·매출처)와 한 셀에 합쳐진 시트(일반거래처)를 나눠 처리한다.
  if (columns.bankName) {
    const items = group.rows.flatMap(({ cells }) => {
      const bankName = clean(cells[columns.bankName]);
      return splitCell(cells[columns.account])
        .map(splitLabel)
        .filter((item) => item.value)
        .map((item) => ({ ...item, bankName }));
    });
    return numberDefaultLabels(
      dedupe(items, (item) => `${item.bankName} / ${item.value}`),
      DEFAULT_LABELS.account
    ).map((item) => ({ label: item.label, bankName: item.bankName, accountNumber: item.value }));
  }

  return collect(group, columns.account, DEFAULT_LABELS.account).map((item) => ({
    label: item.label,
    ...splitBankAndAccount(item.value),
  }));
};

// ─── 거래처 한 건 만들기 ──────────────────────────────────────────────────────
const buildCompany = (group, columns, type, warnings, sheetName) => {
  const first = group.rows[0].cells;
  const businessNumber = clean(first[columns.businessNumber]);
  if (businessNumber && !/^\d{3}-\d{2}-\d{5}$/.test(businessNumber)) {
    warnings.push(`[${sheetName}] ${group.rows[0].row}행 ${group.name}: 사업자등록번호 형식 확인 필요 "${businessNumber}"`);
  }

  const contacts = [
    ...collect(group, columns.phone, DEFAULT_LABELS.phone).map((item) => ({ ...item, kind: "phone" })),
    ...collect(group, columns.fax, DEFAULT_LABELS.fax).map((item) => ({ ...item, kind: "fax" })),
    ...collect(group, [columns.mobile, columns.mobileExtra], DEFAULT_LABELS.mobile).map((item) => ({ ...item, kind: "mobile" })),
  ];

  const emails = collect(group, columns.email, DEFAULT_LABELS.email);
  const addresses = collect(group, columns.address, DEFAULT_LABELS.address);
  const manager = clean(first[columns.manager]);

  return {
    type,
    companyName: group.name,
    aliases: [],
    representativeName: clean(first[columns.representative]) || null,
    businessRegistrationNumber: businessNumber || null,
    bankAccounts: buildAccounts(group, columns),
    contacts: contacts.map((item) => ({
      label: item.label,
      phoneNumber: item.value,
      isListVisible: LIST_VISIBLE[item.kind],
    })),
    emails: emails.map((item) => ({
      label: item.label,
      email: item.value,
      isListVisible: LIST_VISIBLE.email,
    })),
    addresses: addresses.map((item) => ({ label: item.label, address: item.value })),
    // 엑셀의 담당자(이름) 열은 대응 필드가 없어 메모로 옮긴다.
    memo: manager ? `담당자: ${manager}` : null,
    fileIds: [],
  };
};

// ─── 실행 ───────────────────────────────────────────────────────────────────
const filePath = process.argv[2];
const outDir = process.argv[3] ?? path.join(import.meta.dirname, "out");
if (!filePath) {
  console.error('사용법: node scripts/companies-import/convert.js "<엑셀경로>" [출력폴더]');
  process.exit(1);
}

const warnings = [];
const companies = [];
const summary = [];

for (const sheet of readWorkbook(filePath)) {
  const type = SHEET_TYPES[sheet.name.trim()];
  if (!type) {
    warnings.push(`시트 "${sheet.name}"은 거래처 유형이 정해지지 않아 건너뜀`);
    continue;
  }

  const { headerRow, columns } = findHeader(sheet.rows);
  // 매출처처럼 은행명·계좌 헤더가 없는 시트는 매입처와 같은 J·K 열로 본다.
  if (!columns.bankName && !columns.account) {
    const hasBankData = sheet.rows.some(({ row, cells }) => row > headerRow && (cells.J || cells.K));
    if (hasBankData) {
      columns.bankName = "J";
      columns.account = "K";
      warnings.push(`[${sheet.name}] 은행명·계좌 헤더가 없어 J·K 열을 계좌 정보로 사용`);
    }
  }

  const mapped = new Set(Object.values(columns));
  const unmappedValues = new Map();
  for (const { row, cells } of sheet.rows) {
    if (row <= headerRow) continue;
    for (const [column, value] of Object.entries(cells)) {
      if (mapped.has(column)) continue;
      if (!unmappedValues.has(column)) unmappedValues.set(column, []);
      unmappedValues.get(column).push(value);
    }
  }

  // 헤더 없는 열이라도 값이 전부 전화번호면 담당자 폰으로 살린다.
  const looksLikePhone = (value) => /^[\d\s()+-]+$/.test(value) && value.replace(/\D/g, "").length >= 8;
  for (const [column, values] of unmappedValues) {
    if (!columns.mobileExtra && values.every(looksLikePhone)) {
      columns.mobileExtra = column;
      unmappedValues.delete(column);
      warnings.push(`[${sheet.name}] 헤더 없는 ${column}열의 전화번호 ${values.length}건을 담당자 폰으로 추가`);
    }
  }

  if (unmappedValues.size > 0) {
    warnings.push(
      `[${sheet.name}] 매핑하지 않은 열 데이터 무시: ${[...unmappedValues.keys()].sort().join(", ")}`
    );
  }

  const groups = groupRows(sheet.rows, columns, headerRow, warnings, sheet.name);
  const built = groups.map((group) => buildCompany(group, columns, type, warnings, sheet.name));

  summary.push(`${sheet.name}(${type}): ${built.length}건`);
  companies.push(...built);
}

// ─── 시트 간 병합 ────────────────────────────────────────────────────────────
// 같은 회사명이 여러 시트에 있으면 한 거래처로 합친다. 기준은 매입처 → 매출처 → 기타 순서다.
const TYPE_LABELS = { PURCHASE: "매입처", SALES: "매출처", OTHER: "기타" };
const TYPE_PRIORITY = { PURCHASE: 0, SALES: 1, OTHER: 2 };

// 기본 라벨(전화번호, 전화번호1 …)을 쓰는 항목만 번호를 다시 매긴다.
const renumberLabels = (items, defaultLabels) => {
  let result = items;
  for (const defaultLabel of defaultLabels) {
    const isDefault = (label) => String(label).replace(/\d+$/, "") === defaultLabel;
    const total = result.filter((item) => isDefault(item.label)).length;
    let index = 0;
    result = result.map((item) => {
      if (!isDefault(item.label)) return item;
      index += 1;
      return { ...item, label: total > 1 ? `${defaultLabel}${index}` : defaultLabel };
    });
  }
  return result;
};

// 기준 목록에 없는 값만 더한다.
const addMissing = (baseItems, extraItems, keyOf) => {
  const seen = new Set(baseItems.map(keyOf));
  return [...baseItems, ...extraItems.filter((item) => !seen.has(keyOf(item)))];
};

const mergeAcrossSheets = (list) => {
  const byName = new Map();
  for (const company of list) {
    const existing = byName.get(company.companyName);
    if (!existing) {
      byName.set(company.companyName, company);
      continue;
    }

    // 우선순위가 높은 쪽을 기준으로 두고 나머지에서 없는 정보만 채운다.
    const [base, extra] =
      TYPE_PRIORITY[existing.type] <= TYPE_PRIORITY[company.type]
        ? [existing, company]
        : [company, existing];

    warnings.push(
      `[시트 간] "${base.companyName}" 이(가) 여러 시트에 있어 ${TYPE_LABELS[base.type]} 기준으로 병합 (+${TYPE_LABELS[extra.type]})`
    );
    if (
      base.businessRegistrationNumber &&
      extra.businessRegistrationNumber &&
      base.businessRegistrationNumber !== extra.businessRegistrationNumber
    ) {
      warnings.push(
        `[시트 간] "${base.companyName}" 사업자등록번호가 시트마다 다름: ${base.businessRegistrationNumber} / ${extra.businessRegistrationNumber} → 앞의 값 사용`
      );
    }

    base.representativeName = base.representativeName ?? extra.representativeName;
    base.businessRegistrationNumber = base.businessRegistrationNumber ?? extra.businessRegistrationNumber;
    base.contacts = renumberLabels(
      addMissing(base.contacts, extra.contacts, (item) => item.phoneNumber),
      [DEFAULT_LABELS.phone, DEFAULT_LABELS.fax, DEFAULT_LABELS.mobile]
    );
    base.emails = renumberLabels(addMissing(base.emails, extra.emails, (item) => item.email), [
      DEFAULT_LABELS.email,
    ]);
    base.addresses = renumberLabels(addMissing(base.addresses, extra.addresses, (item) => item.address), [
      DEFAULT_LABELS.address,
    ]);
    base.bankAccounts = renumberLabels(
      addMissing(base.bankAccounts, extra.bankAccounts, (item) => `${item.bankName} ${item.accountNumber}`),
      [DEFAULT_LABELS.account]
    );
    base.memo = [base.memo, extra.memo].filter(Boolean).join(" / ") || null;

    byName.set(base.companyName, base);
  }
  return [...byName.values()];
};

const merged = mergeAcrossSheets(companies);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "companies.json"), JSON.stringify(merged, null, 2), "utf8");

const counts = merged.reduce(
  (acc, company) => ({
    contacts: acc.contacts + company.contacts.length,
    emails: acc.emails + company.emails.length,
    addresses: acc.addresses + company.addresses.length,
    accounts: acc.accounts + company.bankAccounts.length,
    noBusinessNumber: acc.noBusinessNumber + (company.businessRegistrationNumber ? 0 : 1),
  }),
  { contacts: 0, emails: 0, addresses: 0, accounts: 0, noBusinessNumber: 0 }
);

const report = [
  `엑셀: ${filePath}`,
  `거래처 ${merged.length}건 (시트 합계 ${companies.length}건에서 시트 간 병합 ${companies.length - merged.length}건)`,
  `시트별 — ${summary.join(" / ")}`,
  `연락처 ${counts.contacts} · 이메일 ${counts.emails} · 주소 ${counts.addresses} · 계좌 ${counts.accounts}`,
  `사업자등록번호 없음 ${counts.noBusinessNumber}건`,
  "",
  `확인 필요 ${warnings.length}건`,
  ...warnings.map((warning) => `- ${warning}`),
].join("\n");

fs.writeFileSync(path.join(outDir, "report.txt"), report, "utf8");

// 눈으로 확인하기 위한 미리보기. 등록에는 companies.json 만 사용한다.
const preview = merged
  .map((company, index) =>
    [
      `${index + 1}. [${TYPE_LABELS[company.type]}] ${company.companyName}`,
      `   대표자 ${company.representativeName ?? "-"} · 사업자번호 ${company.businessRegistrationNumber ?? "-"}`,
      ...company.contacts.map((item) => `   연락처 ${item.label}: ${item.phoneNumber}`),
      ...company.emails.map((item) => `   이메일 ${item.label}: ${item.email}`),
      ...company.addresses.map((item) => `   주소 ${item.label}: ${item.address}`),
      ...company.bankAccounts.map((item) => `   계좌 ${item.label}: ${item.bankName} ${item.accountNumber}`),
      ...(company.memo ? [`   메모 ${company.memo}`] : []),
    ].join("\n")
  )
  .join("\n\n");

fs.writeFileSync(path.join(outDir, "preview.txt"), `${report}\n\n${"=".repeat(60)}\n\n${preview}\n`, "utf8");

console.log(report);
console.log(`\n${path.join(outDir, "companies.json")} 저장 완료 (미리보기: preview.txt)`);
