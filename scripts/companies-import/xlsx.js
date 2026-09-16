// 의존성 없이 .xlsx(zip + XML)를 읽어 시트별 셀 값을 돌려준다.
// 외부 라이브러리를 추가하지 않기 위해 zip 해제와 XML 파싱을 직접 처리한다.
import fs from "node:fs";
import zlib from "node:zlib";

// ─── zip 해제 ────────────────────────────────────────────────────────────────
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;

const findEndOfCentralDirectory = (buffer) => {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) return offset;
  }
  throw new Error("zip 구조를 찾지 못했습니다. xlsx 파일이 맞는지 확인해 주세요.");
};

const unzip = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const eocd = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);

  const entries = {};
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== CENTRAL_SIGNATURE) break;

    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);

    // 실제 데이터 위치는 로컬 헤더의 이름·extra 길이를 다시 읽어야 한다.
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);

    entries[name] = method === 0 ? raw : zlib.inflateRawSync(raw);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
};

// ─── XML 파싱 ────────────────────────────────────────────────────────────────
const decodeXml = (text) =>
  text
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&");

const readSharedStrings = (entries) => {
  const file = entries["xl/sharedStrings.xml"];
  if (!file) return [];
  const xml = file.toString("utf8");
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((item) =>
    [...item[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((text) => decodeXml(text[1])).join("")
  );
};

const readSheetIndex = (entries) => {
  const workbook = entries["xl/workbook.xml"].toString("utf8");
  const rels = entries["xl/_rels/workbook.xml.rels"].toString("utf8");
  const target = Object.fromEntries(
    [...rels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((rel) => [
      rel[1],
      rel[2].replace(/^\/?xl\//, ""),
    ])
  );
  return [...workbook.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map((sheet) => ({
    name: decodeXml(sheet[1]),
    path: `xl/${target[sheet[2]]}`,
  }));
};

const columnOf = (ref) => ref.match(/^[A-Z]+/)[0];
const rowNumberOf = (ref) => Number(ref.match(/\d+$/)[0]);

// 시트 → [{ row: 3, cells: { B: "세종자원", ... } }]
const readSheet = (entries, path, shared) => {
  const xml = entries[path].toString("utf8");
  const rows = new Map();

  for (const cell of xml.matchAll(/<c\s([^>]*?)(\/>|>([\s\S]*?)<\/c>)/g)) {
    const attributes = cell[1];
    const body = cell[3] ?? "";
    const ref = attributes.match(/r="([^"]+)"/)?.[1];
    if (!ref) continue;

    const type = attributes.match(/t="([^"]+)"/)?.[1];
    let value = "";
    if (type === "s") {
      const index = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      value = index == null ? "" : shared[Number(index)] ?? "";
    } else if (type === "inlineStr") {
      value = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((text) => decodeXml(text[1])).join("");
    } else {
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      value = raw == null ? "" : decodeXml(raw);
    }
    if (!value.trim()) continue;

    const rowNumber = rowNumberOf(ref);
    if (!rows.has(rowNumber)) rows.set(rowNumber, {});
    rows.get(rowNumber)[columnOf(ref)] = value;
  }

  return [...rows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([row, cells]) => ({ row, cells }));
};

// .xlsx → [{ name, rows: [{ row, cells }] }]
const readWorkbook = (filePath) => {
  const entries = unzip(filePath);
  const shared = readSharedStrings(entries);
  return readSheetIndex(entries).map((sheet) => ({
    name: sheet.name,
    rows: readSheet(entries, sheet.path, shared),
  }));
};

export { readWorkbook };
