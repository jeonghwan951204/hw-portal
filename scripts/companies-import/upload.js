// 변환한 거래처 JSON 을 POST /api/companies 로 등록한다.
// 사용법:
//   node scripts/companies-import/upload.js --base https://dev-api.jeongcloud.cloud --token <accessToken>
// 옵션:
//   --file  <경로>   기본값 out/companies.json
//   --from  <번호>   중단된 지점부터 다시 시작 (1부터)
//   --limit <개수>   앞에서 N건만 등록 (시험 투입용)
//   --dry-run        실제 호출 없이 대상만 출력
// 토큰은 --token 대신 환경변수 HW_TOKEN 으로도 넘길 수 있다.
import fs from "node:fs";
import path from "node:path";

const readArgs = () => {
  const args = process.argv.slice(2);
  const options = { dryRun: args.includes("--dry-run") };
  for (let index = 0; index < args.length; index += 1) {
    const next = args[index + 1];
    if (args[index] === "--base") options.base = next;
    if (args[index] === "--token") options.token = next;
    if (args[index] === "--file") options.file = next;
    if (args[index] === "--from") options.from = Number(next);
    if (args[index] === "--limit") options.limit = Number(next);
  }
  return options;
};

const options = readArgs();
const token = options.token ?? process.env.HW_TOKEN;
const file = options.file ?? path.join(import.meta.dirname, "out", "companies.json");
const from = options.from ?? 1;

if (!options.base) {
  console.error("--base <API 주소> 가 필요합니다. 예: --base https://dev-api.jeongcloud.cloud");
  process.exit(1);
}
if (!token && !options.dryRun) {
  console.error("--token <accessToken> 또는 환경변수 HW_TOKEN 이 필요합니다.");
  process.exit(1);
}

const all = JSON.parse(fs.readFileSync(file, "utf8"));
const targets = all.slice(from - 1, options.limit ? from - 1 + options.limit : undefined);

console.log(`대상 ${targets.length}건 (전체 ${all.length}건 중 ${from}번부터)${options.dryRun ? " — dry-run" : ""}`);

const succeeded = [];
const failed = [];

for (const [index, company] of targets.entries()) {
  const number = from + index;
  if (options.dryRun) {
    console.log(`${number}. [dry-run] ${company.type} ${company.companyName}`);
    continue;
  }

  try {
    const response = await fetch(`${options.base}/api/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(company),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status} ${text.slice(0, 200)}`);

    succeeded.push(company.companyName);
    console.log(`${number}. 등록 완료 ${company.companyName}`);
  } catch (error) {
    failed.push({ number, companyName: company.companyName, message: error.message });
    console.error(`${number}. 실패 ${company.companyName} — ${error.message}`);
  }
}

if (!options.dryRun) {
  const resultPath = path.join(path.dirname(file), "upload-result.json");
  fs.writeFileSync(resultPath, JSON.stringify({ succeeded, failed }, null, 2), "utf8");
  console.log(`\n성공 ${succeeded.length}건 · 실패 ${failed.length}건 → ${resultPath}`);
  if (failed.length > 0) {
    console.log("실패 건은 위 번호를 --from 으로 지정해 다시 실행할 수 있습니다.");
    process.exitCode = 1;
  }
}
